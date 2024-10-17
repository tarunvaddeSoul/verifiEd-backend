import axios from 'axios';

const verifyBankAccount = async () => {
  try {
    const response = await axios.post(
      'https://api.trential.app/verification/api/1.0/verifications/bank-account',
      {
        // ifsc: "SBIN0030460",
        ifsc: "UTIB0003077",
        // accountNumber: "39290343515",
        accountNumber: "919010028526063",
        pennyLess: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': '1c83852c-9e02-4b59-ab7b-34bd199a0f4c'
        }
      }
    );
    console.log(response.data);
  } catch (error: any) {
    console.error('Error verifying bank account:', error.response?.data || error.message);
  }
};

verifyBankAccount();
