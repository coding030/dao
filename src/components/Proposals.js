import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { ethers } from 'ethers'

const Proposals = ({ 
	provider,
	dao, 
	proposals, 
	quorum, 
	setIsLoading, 
	account, 
	voteStatus,
	recipientBalance
	}) => {

  const voteHandler = async (id, voteType) => {
  	try {
  		const signer = await provider.getSigner()
  		const transaction = await dao.connect(signer).vote(id, voteType)
  		await transaction.wait()
  		console.log(transaction)
    } catch {
    	window.alert('User rejected or transaction reverted')
    }
  	setIsLoading(true)
  }

  const finalizeHandler = async (id) => {
  	try {
  		const signer = await provider.getSigner()
  		const transaction = await dao.connect(signer).finalizeProposal(id)
  		await transaction.wait()
    } catch {
    	window.alert('User rejected or transaction reverted')
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
            <td>{ethers.utils.formatUnits(recipientBalance[index], 'ether')} token</td>
            <td>{ethers.utils.formatUnits(proposal.amount, 'ether')} ETH</td>
            <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
            <td>{ethers.utils.formatUnits(proposal.votesFor, 'ether')}</td>
            <td>{ethers.utils.formatUnits(proposal.votesAgainst, 'ether')}</td>
            <td>{ethers.utils.formatUnits(proposal.votesAbstain, 'ether')}</td>
            <td>
                {!proposal.finalized && !voteStatus[proposal.id.toString()] && (
            	  <Button 
            	    variant="primary" 
            	    style={{ width: '100%' }}
            	    onClick={() => voteHandler(proposal.id, 0)}
            	  >
            	    Vote
            	  </Button>
                )}
            </td>
            <td>
                {!proposal.finalized && !voteStatus[proposal.id.toString()] && (
            	  <Button 
            	    variant="primary" 
            	    style={{ width: '100%' }}
            	    onClick={() => voteHandler(proposal.id, 1)}
            	  >
            	    Vote
            	  </Button>
                )}
            </td>
            <td>
                {!proposal.finalized && !voteStatus[proposal.id.toString()] && (
            	  <Button 
            	    variant="primary" 
            	    style={{ width: '100%' }}
            	    onClick={() => voteHandler(proposal.id, 2)}
            	  >
            	    Vote
            	  </Button>
                )}
            </td>
            <td>
                {
                  !proposal.finalized && 
                  (
                    parseFloat(ethers.utils.formatUnits(proposal.votesFor, 'ether')) - 
                    parseFloat(ethers.utils.formatUnits(proposal.votesAgainst, 'ether'))
                   ) > parseFloat(ethers.utils.formatUnits(quorum, 'ether')) && (
            	  <Button 
            	    variant="primary" 
            	    style={{ width: '100%' }}
            	    onClick={() => finalizeHandler(proposal.id)}            	    
            	  >
            	    Finalize
            	  </Button>
                )}
            </td>
          </tr>          	
          ))}
      </tbody>
    </Table>
  );
}

export default Proposals;
