//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract DAO {
    address owner;
    Token public token;
    uint256 public quorum;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 votes;
        bool finalized;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping (uint256 => bool)) public votes;

    event Propose(
        uint id,
        uint256 amount,
        address recipient,
        address creator
    );

    event Vote(uint256 id, address investor);
    event Finalize(uint256 id);

    constructor(Token _token, uint256 _quorum) public {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    receive() external payable{}

    modifier onlyInvestor() {
        require(
            Token(token).balanceOf(msg.sender) > 0, 
//            token.balanceOf(msg.sender) > 0, 
            "must be token holder"
        );
        _;
    }

    function createProposal(
        string memory _name, 
        uint256 _amount, 
        address payable _recipient
    ) external onlyInvestor {
        require(address(this).balance >= _amount);

        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount, 
            _name, 
            _amount, 
            _recipient, 
            0, 
            false
        );

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    // Vote on proposal
    function vote(uint256 _id) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        require(!votes[msg.sender][_id], "already voted");

        proposal.votes +=  token.balanceOf(msg.sender);

        votes[msg.sender][_id] = true;

        emit Vote(_id, msg.sender);
    }

    // Finalize proposal & transfer funds
    function finalizeProposal(uint256 _id) external onlyInvestor {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // Mark proposal as finalized
        proposal.finalized = true;

        // Check that the contract has enough votes
        require(proposal.votes >= quorum, "must reach quorum to finalize proposal");

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
