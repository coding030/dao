//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


contract DAO {
    address owner;
    Token public token;
    uint256 public quorum;
    uint256 public proposalCount;
    uint256 finalForVotes = 0;
//    IERC20 public paymentToken;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
//        uint256 votes;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool finalized;
//        mapping(address => mapping (uint256 => bool)) public votes;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping (uint256 => bool)) public votes;
    mapping(address => mapping (uint256 => VoteType)) public votesType;

    enum VoteType {For, Against, Abstain}

    event Propose(
        uint id,
        uint256 amount,
        address recipient,
        address creator
    );
    event Vote(uint256 id, address investor);
    event Finalize(uint256 id);

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
//        paymentToken = IERC20(_paymentTokenAddress);
    }

    receive() external payable{}

    modifier onlyInvestor() {
        require(
            token.balanceOf(msg.sender) > 0,
            "must be token holder"
        );
        _;
    }

    function createProposal(
        string memory _name,
        uint256 _amount,
        address payable _recipient
    ) external onlyInvestor {
        require(
            address(this).balance >= _amount,
            "Proposal amount exceeds DAO treasury balance"
        );
        require(bytes(_name).length > 0);

        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            0,
            0,
            0,
            false
        );

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    // Vote on proposal
    function vote(uint256 _id, VoteType _voteType) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        require(!votes[msg.sender][_id], "already voted");

        if (_voteType == VoteType.For) {
            proposal.votesFor +=  token.balanceOf(msg.sender);
//            proposal.votes +=  token.balanceOf(msg.sender);
        } else if (_voteType == VoteType.Against) {
            proposal.votesAgainst +=  token.balanceOf(msg.sender);
//            proposal.votes -=  token.balanceOf(msg.sender);
        } else if (_voteType == VoteType.Abstain) {
            proposal.votesAbstain += token.balanceOf(msg.sender);
        }

//        proposal.votes +=  token.balanceOf(msg.sender);

        votes[msg.sender][_id] = true;
        votesType[msg.sender][_id] = _voteType;

        emit Vote(_id, msg.sender);
    }

//    function hasVoted(uint proposalId, address user) public view returns (bool) {
//        return proposals[proposalId].voters[user];
//    }

    // Finalize proposal & transfer funds
    function finalizeProposal(uint256 _id) external onlyInvestor {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // Mark proposal as finalized
        proposal.finalized = true;

        // Check that the contract has enough votes
//        require(proposal.votesFor >= quorum, "must reach quorum to finalize proposal");
//        require(proposal.votes >= quorum, "must reach quorum to finalize proposal");
        if (proposal.votesFor > proposal.votesAgainst) {
            finalForVotes = proposal.votesFor - proposal.votesAgainst;
        }
        require(finalForVotes >= quorum, "must reach quorum to finalize proposal");

        // Check that the contract has enough ether
        require(address(this).balance >= proposal.amount);

        // Transfer the funds to recipient
//        proposal.recipient.transfer(proposal.amount);
        (bool sent, ) = proposal.recipient.call{ value: proposal.amount}("");
        require(sent);

        // Emit event
        emit Finalize(_id);
    }

}
