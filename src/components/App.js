import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Create from './Create';
import Proposals from './Proposals';
import Loading from './Loading';

// ABIs: Import your contract ABIs here
import DAO_ABI from '../abis/DAO.json'
import Token_ABI from '../abis/Token.json'

// Config: Import your network config here
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [dao, setDao] = useState(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)
//  const [recipientBalance, setRecipientBalance] = useState(0)
  const [voteStatus, setVoteStatus] = useState({})

  const [account, setAccount] = useState('')

  const [proposals, setProposals] = useState(null)
  const [quorum, setQuorum] = useState(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // Fetch Chain ID
    const { chainId } = await provider.getNetwork()

    // Initiate contract
    const dao = new ethers.Contract(config[chainId].dao.address, DAO_ABI, provider)
    setDao(dao)

    const token = new ethers.Contract(config[chainId].token.address, Token_ABI, provider)

    // Fetch treasury balance
    let treasuryBalance = await provider.getBalance(dao.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18)
    setTreasuryBalance(treasuryBalance)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    const count = await dao.proposalCount()
    const items = []
    const statuses = {}
//    const recBalances = []

    for(let i = 0; i < count; i++) {
      const proposal = await dao.proposals(i + 1)
      const recipientTokens = await token.balanceOf(proposal.recipient)

      items.push({
        ...proposal,
        recipientBalance: recipientTokens
      })

      const hasVoted = await dao.votes(account, proposal.id)
      statuses[proposal.id.toString()] = hasVoted;
    }

//    setProposals(items)
    setProposals([...items])
//    setVoteStatus(statuses)
    setVoteStatus({...statuses})

//  console.log("Proposals after loading:", items.map(p => ({
//    id: p.id.toString(),
//    name: p.name,
//    votesFor: p.votesFor.toString(),
//    votesAgainst: p.votesAgainst.toString(),
//    finalized: p.finalized
//  })))

    // Fetch quorum
    let quorum = await dao.quorum()
    quorum = quorum.toString()
    setQuorum(quorum)

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
//      loadBlockchainData().finally(() => setIsLoading(false));
      loadBlockchainData()
    }
  }, [isLoading]);

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Welcome to our DAO!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Create
            provider={provider}
            dao={dao}
            setIsLoading={setIsLoading}
          />

          <hr/>

          <p className='text-center'>
            <strong>Treasury Balance:</strong> {treasuryBalance} ETH
          </p>

          <hr/>

          <p className='text-center'>
            <strong>Required quorum:</strong> {ethers.utils.formatUnits(quorum, 18)} votes
          </p>

          <hr/>

          <Proposals
            provider={provider}
            dao={dao}
            proposals={proposals}
            quorum={quorum}
            setIsLoading={setIsLoading}
            account={account}
            voteStatus={voteStatus}
          />
        </>
      )}
    </Container>
  )
}

export default App;
