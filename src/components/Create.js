import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers'

const Create = ({ provider, dao, setIsLoading }) => {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [address, setAddress] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)

  const createHandler = async (e) => {
    e.preventDefault()
    setIsWaiting(true)

    try {
      const signer = await provider.getSigner()
      const formattedAmount = ethers.utils.parseUnits(amount.toString(), 'ether')

      const transaction = await dao.connect(signer).createProposal(name, formattedAmount, address)
      await transaction.wait()
    } catch (error) {
      if (error.code === 4001) {
        window.alert('Transaction rejected by the user.');
      } else {
        window.alert('Transaction failed: ' + (error.reason || error.message || 'Unknown error'));
      }
    }

    setIsWaiting(false)
    setIsLoading(true)
  }

  return(
    <Form onSubmit={createHandler}>
      <Form.Group
        style={{ maxWidth: '650px', margin: '50px auto' }}
        className='bg-dark text-light p-4 rounded'
      >
        <Form.Control
          type='text'
          placeholder='Enter proposal description'
          className='my-2'
          onChange={(e) => setName(e.target.value)}
        />
        <Form.Control
          type='number'
          placeholder='Enter amount from treasury to be assigned to proposal'
          className='my-2 bg-dark text-light'
          onChange={(e) => setAmount(e.target.value)}
        />
        <Form.Control
          type='text'
          placeholder='Enter recipient address if proposal is approved'
          className='my-2'
          onChange={(e) => setAddress(e.target.value)}
        />
        {isWaiting ? (
          <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
        ) : (
          <Button variant='primary' type='submit' style={{ width: '100%' }}>
            Create Proposal
          </Button>
        )}
      </Form.Group>
    </Form>
  )
}

export default Create;
