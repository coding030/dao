import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { ethers } from 'ethers'
import React, { useState, useEffect } from 'react';

//const getTimeRemaining = (deadline) => {
//  const now = Math.floor(Date.now() / 1000)
//  const secondsRemaining = deadline - now//

//  if (secondsRemaining <= 0) return "Expired"//

//  const d = Math.floor(secondsRemaining / (3600 * 24))
//  const h = Math.floor((secondsRemaining % (3600 * 24)) / 3600)
//  const m = Math.floor((secondsRemaining % 3600) / 60)
//  const s = secondsRemaining % 60//

//  return `${d}d ${h}h ${m}m ${s}s`
//}

const Proposals = ({
	provider,
	dao,
	proposals,
	quorum,
	setIsLoading,
	account,
	voteStatus,
  isInvestor
	}) => {
  const [countdowns, setCountdowns] = useState({});

  // Update countdowns every second
  useEffect(() => {
    if (!proposals || proposals.length === 0) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000); // current time in seconds
      const updatedCountdowns = {};

      proposals.forEach((proposal) => {
        const remaining = proposal.deadline - now;
        updatedCountdowns[proposal.id.toString()] = remaining > 0 ? remaining : 0;
      });

      setCountdowns(updatedCountdowns);
    }, 1000);

    return () => clearInterval(interval); // cleanup on unmount
  }, [proposals]);

  // Format seconds to "HH:MM:SS"
  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Expired';

    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');

    return `${h}:${m}:${s}`;
  };

  const voteHandler = async (id, voteType) => {
  	try {
  		const signer = await provider.getSigner()
  		const transaction = await dao.connect(signer).vote(id, voteType)
  		await transaction.wait()
  		console.log("transaction (Proposals.js):", transaction)
      console.log("id:", id)
      console.log("voteType:", voteType)
    } catch (error) {
      if (error.code === 4001) {
        window.alert('Transaction rejected by the user.');
      } else {
        window.alert('Transaction failed: ' + (error.reason || error.message || 'Unknown error'));
      }
    }
  	setIsLoading(true)
  }

  const finalizeHandler = async (id) => {
  	try {
  		const signer = await provider.getSigner()
  		const transaction = await dao.connect(signer).finalizeProposal(id)
  		await transaction.wait()
    } catch (error) {
      if (error.code === 4001) {
        window.alert('Transaction rejected by the user.');
      } else {
        window.alert('Transaction failed: ' + (error.reason || error.message || 'Unknown error'));
      }
    }

  	setIsLoading(true)
  }

  return (
    <Table striped bordered hover responsive variant='dark'>
      <thead>
        <tr>
          <th>#</th>
          <th>Proposal Name</th>
          <th>Recipient Address</th>
          <th>Recipient Token Balance</th>
          <th>Prposal Amount</th>
          <th>Status</th>
          <th>Total 'For' Votes</th>
          <th>Total 'Against' Votes</th>
          <th>Total 'Abstain' Votes</th>
          <th>Cast 'For'</th>
          <th>Cast 'Against'</th>
          <th>Cast 'Abstain'</th>
          <th>Finalize</th>
          <th>Voting Expires In</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => (
        <tr key={index}>
          <td>{proposal.id.toString()}</td>
          <td>{proposal.name}</td>
          <td style={{
          	maxWidth: '200px',
          	overflow: 'hidden',
          	textOverflow: 'ellipsis',
          	whiteSpace: 'nowrap'
          	}}
          >
          	{proposal.recipient}
          </td>
          <td>{ethers.utils.formatUnits(proposal.recipientBalance, 'ether')} token</td>
          <td>{ethers.utils.formatUnits(proposal.amount, 'ether')} ETH</td>
          <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
          <td>{ethers.utils.formatUnits(proposal.votesFor, 'ether')}</td>
          <td>{ethers.utils.formatUnits(proposal.votesAgainst, 'ether')}</td>
          <td>{ethers.utils.formatUnits(proposal.votesAbstain, 'ether')}</td>
          <td>
            {!proposal.finalized && !voteStatus[proposal.id.toString()] && (
            <OverlayTrigger
              placement="top"
              overlay={
                !isInvestor ? <Tooltip>You must hold DAO tokens to vote</Tooltip> : <></>
              }
            >
              <span className="d-inline-block" style={{ width: '100%' }}>
                <Button
                  variant="primary"
                  onClick={() => voteHandler(proposal.id, 0)}
                  disabled={!isInvestor}
                  style={{ width: '100%', pointerEvents: isInvestor ? 'auto' : 'none' }}
                >
                  Vote
                </Button>
              </span>
            </OverlayTrigger>
            )}
          </td>
          <td>
            {!proposal.finalized && !voteStatus[proposal.id.toString()] && (
            <OverlayTrigger
              placement="top"
              overlay={
                !isInvestor ? <Tooltip>You must hold DAO tokens to vote</Tooltip> : <></>
              }
            >
              <span className="d-inline-block" style={{ width: '100%' }}>
                <Button
                  variant="primary"
                  onClick={() => voteHandler(proposal.id, 1)}
                  disabled={!isInvestor}
                  style={{ width: '100%', pointerEvents: isInvestor ? 'auto' : 'none' }}
                >
                  Vote
                </Button>
              </span>
            </OverlayTrigger>
            )}
          </td>
          <td>
            {!proposal.finalized && !voteStatus[proposal.id.toString()] && (
            <OverlayTrigger
              placement="top"
              overlay={
                !isInvestor ? <Tooltip>You must hold DAO tokens to vote</Tooltip> : <></>
              }
            >
              <span className="d-inline-block" style={{ width: '100%' }}>
                <Button
                  variant="primary"
                  onClick={() => voteHandler(proposal.id, 2)}
                  disabled={!isInvestor}
                  style={{ width: '100%', pointerEvents: isInvestor ? 'auto' : 'none' }}
                >
                  Vote
                </Button>
              </span>
            </OverlayTrigger>
            )}
          </td>
          <td>
            {!proposal.finalized &&
//                proposal.votesFor.sub(proposal.votesAgainst).gt(quorum) && (
              proposal.votesFor.gte(quorum) && (
              <OverlayTrigger
                placement="top"
                overlay={
                  !isInvestor ? <Tooltip>You must hold DAO tokens to finalize</Tooltip> : <></>
                }
              >
              <span className="d-inline-block" style={{ width: '100%' }}>
                <Button
                  variant="primary"
                  onClick={() => finalizeHandler(proposal.id)}
                  disabled={!isInvestor}
                  style={{ width: '100%', pointerEvents: isInvestor ? 'auto' : 'none' }}
                >
                  Finalize
                </Button>
              </span>
            </OverlayTrigger>
            )}
          </td>
          <td>
            {countdowns[proposal.id.toString()] > 0
              ? formatTime(countdowns[proposal.id.toString()])
              : 'Expired'}
          </td>
        </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default Proposals;
