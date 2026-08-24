export const mockCms1500Service = {
  async getClaimsByBillId(billId) {
    return [
      {
        claimId: `claim-${billId}-1`,
        billId: billId,
        dosDisplay: '01/15/2025',
        providerName: 'Dr. Jane Smith',
        box2: 'John Doe',
        box17ReferringName: 'Dr. Segun Adeoye',
        box21Diagnoses: ['M54.5', 'M54.12'],
        box28TotalCharge: 250.00,
        status: 'Generated & Validated'
      }
    ];
  }
};
