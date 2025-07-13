//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract DAO {
    address public owner;
    Token public token;
    uint256 public quorum;
    uint256 public proposalCount;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool finalized;
        uint256 deadline;
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
    event Expired(uint256 id);

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
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
        uint256 duration = 3 hours;

        require(
            address(this).balance >= _amount,
            "Proposal amount exceeds DAO treasury balance"
        );
        require(bytes(_name).length > 0);
        require(_amount > 0, "Proposal amount must be positive");
        require(_recipient != address(0), "Invalid recipient");

        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            0,
            0,
            0,
            false,
            block.timestamp + duration
        );

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    // Vote on proposal
    function vote(uint256 _id, VoteType _voteType) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        require(!votes[msg.sender][_id], "already voted");
        require(block.timestamp < proposal.deadline, "Voting period has ended");

        if (_voteType == VoteType.For) {
            proposal.votesFor +=  token.balanceOf(msg.sender);
        } else if (_voteType == VoteType.Against) {
            proposal.votesAgainst +=  token.balanceOf(msg.sender);
        } else if (_voteType == VoteType.Abstain) {
            proposal.votesAbstain += token.balanceOf(msg.sender);
        }

        votes[msg.sender][_id] = true;
        votesType[msg.sender][_id] = _voteType;

        emit Vote(_id, msg.sender);
    }

    // Finalize proposal & transfer funds
    function finalizeProposal(uint256 _id) external onlyInvestor {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        require(proposal.finalized == false, "proposal already finalized");
        require(proposal.votesFor >= quorum, "must reach quorum to finalize proposal");
        require(
            address(this).balance >= proposal.amount,
            "proposal amount exceeds treasury balance"
        );

        // Mark proposal as finalized
        proposal.finalized = true;
        // Transfer the funds to recipient
        (bool sent, ) = proposal.recipient.call{ value: proposal.amount}("");
        require(sent);

        // Emit event
        emit Finalize(_id);
    }

    function markExpired(uint256 _id) external onlyInvestor {
        Proposal storage proposal = proposals[_id];

        require(!proposal.finalized, "Already finalized");
        require(block.timestamp >= proposal.deadline, "Not expired yet");
        require(proposal.votesFor < quorum, "Quorum met");

        proposal.finalized = true;

        emit Expired(_id);
    }

}
