const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => {
  let token, dao
  let deployer,
      funder,
      investor1,
      investor2,
      investor3,
      investor4,
      investor5,
      recipient,
      user

  beforeEach(async () => {
    let accounts = await ethers.getSigners()
    deployer = accounts[0]
    funder = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]
    investor3 = accounts[4]
    investor4 = accounts[5]
    investor5 = accounts[6]
    recipient = accounts[7]
    user = accounts[8]

    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')

    transaction = await token.connect(deployer).transfer(investor1.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor2.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor3.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor4.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor5.address, tokens(200000))
    await transaction.wait()

    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(token.address, '500000000000000000000001')

    await funder.sendTransaction({ to: dao.address, value: ether('100') })
  })

  describe('Deployment', () => {

    it('returns token address', async () => {
      expect(await dao.token()).to.equal(token.address)
    })

    it('returns quorum', async () => {
      expect(await dao.quorum()).to.equal('500000000000000000000001')
    })

    it('sends ETH to dao treasury', async () => {
      expect(await ethers.provider.getBalance(dao.address)).to.equal(ether('100'))
    })
  })

  describe('Proposal creation', () => {
    let transaction, result

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether('100'), recipient.address)
        result = await transaction.wait()
      })

      it('updates proposal count', async () => {
        expect(await dao.proposalCount()).to.equal(1)
      })

      it('updates proposal mapping', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.id).to.equal(1)
        expect(proposal.amount).to.equal(ether(100))
        expect(proposal.recipient).to.equal(recipient.address)
      })

      it('emits a propose event', async () => {
        await expect(transaction).to.emit(dao, 'Propose')
          .withArgs(1, ether(100), recipient.address, investor1.address)
      })

      it('sets a proposal deadline in the future', async () => {
        const proposal = await dao.proposals(1)
        const currentTime = (await ethers.provider.getBlock("latest")).timestamp
        expect(proposal.deadline).to.be.gt(currentTime)
      })
    })

    describe('Failure', () => {

      it('rejects invalid amount', async () => {
        await expect(dao.connect(investor1).createProposal('Proposal 1', ether('1000'), recipient.address)).to.be.reverted
      })

      it('rejects non-investor', async () => {
        await expect(dao.connect(user).createProposal('Proposal 1', ether('100'), recipient.address)).to.be.reverted
      })

      it('rejects empty proposal name', async () => {
        await expect(dao.connect(investor1).createProposal('', ether('100'), recipient.address)).to.be.reverted
      })
    })
  })

  describe('Voting', () => {
    let transaction, result, proposal

    beforeEach(async () => {
      transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
      result = await transaction.wait()
    })

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).vote(1, '0')
        result = await transaction.wait()
        transaction = await dao.connect(investor2).vote(1, '1')
        result = await transaction.wait()
      })

      it('updates for votes', async () => {
        proposal = await dao.proposals(1)
        expect(proposal.votesFor).to.equal(tokens(200000))
      })

      it('emits vote event', async () => {
        await expect(transaction).to.emit(dao, 'Vote')
          .withArgs(1, investor2.address)
      })

      it('updates against votes', async () => {
        proposal = await dao.proposals(1)
        expect(proposal.votesAgainst).to.equal(tokens(200000))
      })
    })

    describe('Failure', () => {

      it('rejects non-investor', async () => {
        await expect(dao.connect(user).vote(1, 1)).to.be.reverted
      })

      it('rejects double voting', async () => {
        transaction = await dao.connect(investor1).vote(1, 1)
        result = await transaction.wait()

        await expect(dao.connect(investor1).vote(1, 1)).to.be.reverted
      })

      it('prevents voting after deadline', async () => {
        // Advance time beyond the deadline
        await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]) // 3 days + 1 sec
        await network.provider.send("evm_mine")

        await expect(dao.connect(investor2).vote(1, 0)).to.be.revertedWith("Voting period has ended")
      })
    })
  })

  describe('Governance', () => {
    let transaction, result

    describe('Success', () => {

      beforeEach(async () => {
        // Create proposal
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
        result = await transaction.wait()

        // Vote
        transaction = await dao.connect(investor1).vote(1, 0)
        result = await transaction.wait()
        transaction = await dao.connect(investor2).vote(1, 0)
        result = await transaction.wait()
        transaction = await dao.connect(investor3).vote(1, 0)
        result = await transaction.wait()
      })

      it('transfers funds to the recipient', async () => {
        // Finalize proposal
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
        expect(await ethers.provider.getBalance(recipient.address)).to.equal(tokens(10100))
      })

      it('it updates the proposal to finalized', async () => {
        // Finalize proposal
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
        // after this the recipient actually has 10200 tokens
        const proposal = await dao.proposals(1)
        expect(proposal.finalized).to.equal(true)
      })

      it('emits a finalize event', async () => {
        // Finalize proposal
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()
        await expect(transaction).to.emit(dao, 'Finalize')
          .withArgs(1)
      })

      it('allows finalization before deadline if quorum is met', async () => {
        await dao.connect(investor1).finalizeProposal(1)
        const proposal = await dao.proposals(1)
        expect(proposal.finalized).to.equal(true)
      })

      it('allows finalization after deadline if quorum is met', async () => {
        // Wait for deadline to pass
        await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1])
        await network.provider.send("evm_mine")

        await dao.connect(investor1).finalizeProposal(1) // should succeed
        const proposal = await dao.proposals(1)
        expect(proposal.finalized).to.equal(true)
      })
    })

    describe('Failure', () => {

      beforeEach(async () => {
        // Create proposal
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
        result = await transaction.wait()

        // Vote
        transaction = await dao.connect(investor1).vote(1, 0)
        result = await transaction.wait()

        transaction = await dao.connect(investor2).vote(1, 0)
        result = await transaction.wait()
      })

      it('rejects proposal if already finalized', async () => {
        // Vote 3
        transaction = await dao.connect(investor3).vote(1, 0)
        result = await transaction.wait()

        // Finalize
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = await transaction.wait()

        // Finalize again
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
      })

      it('rejects finalization if not enough votes', async () => {
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
      })

      it('rejects finalization from a non-investor', async () => {
        // Vote 3
        transaction = await dao.connect(investor3).vote(1, 0)
        result = await transaction.wait()

        // Finalize
        await expect(dao.connect(user).finalizeProposal(1)).to.be.reverted
      })

    })
  })
})
