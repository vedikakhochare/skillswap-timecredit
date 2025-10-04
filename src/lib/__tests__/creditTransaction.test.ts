/**
 * Test file for credit transaction system
 * This file demonstrates how the credit transaction system works
 */

import { 
  completeSessionWithCredits, 
  createBooking, 
  getUserBookings, 
  getProviderBookings 
} from '../skillService';
import { 
  getUserTransactionHistory, 
  getUserProfileWithHistory 
} from '../userService';
import { getEnhancedUserTransactions } from '../transactionService';

// Mock test data
const mockBookingData = {
  skillId: 'test-skill-id',
  requesterId: 'requester-user-id',
  providerId: 'provider-user-id',
  date: new Date(),
  time: '10:00 AM',
  status: 'confirmed' as const,
  credits: 5
};

/**
 * Test function to verify credit transaction flow
 * This would be called in a real test environment
 */
export const testCreditTransactionFlow = async () => {
  console.log('🧪 Testing Credit Transaction Flow...');
  
  try {
    // Step 1: Create a confirmed booking
    console.log('1. Creating confirmed booking...');
    const bookingId = await createBooking(mockBookingData);
    console.log(`✅ Booking created with ID: ${bookingId}`);
    
    // Step 2: Complete the session (this should transfer credits)
    console.log('2. Completing session...');
    const result = await completeSessionWithCredits(bookingId);
    
    if (result.success) {
      console.log('✅ Session completed successfully');
      console.log(`📝 Message: ${result.message}`);
    } else {
      console.log('❌ Session completion failed');
      console.log(`📝 Error: ${result.message}`);
      return;
    }
    
    // Step 3: Verify transaction history for requester
    console.log('3. Checking requester transaction history...');
    const requesterHistory = await getUserTransactionHistory(mockBookingData.requesterId);
    const requesterSpentTransactions = requesterHistory.filter(t => t.type === 'spent');
    console.log(`📊 Requester spent transactions: ${requesterSpentTransactions.length}`);
    
    // Step 4: Verify transaction history for provider
    console.log('4. Checking provider transaction history...');
    const providerHistory = await getUserTransactionHistory(mockBookingData.providerId);
    const providerEarnedTransactions = providerHistory.filter(t => t.type === 'earned');
    console.log(`📊 Provider earned transactions: ${providerEarnedTransactions.length}`);
    
    // Step 5: Get enhanced transaction details
    console.log('5. Getting enhanced transaction details...');
    const enhancedRequesterTransactions = await getEnhancedUserTransactions(mockBookingData.requesterId);
    const enhancedProviderTransactions = await getEnhancedUserTransactions(mockBookingData.providerId);
    
    console.log(`📈 Enhanced requester transactions: ${enhancedRequesterTransactions.length}`);
    console.log(`📈 Enhanced provider transactions: ${enhancedProviderTransactions.length}`);
    
    // Step 6: Get user profiles with history
    console.log('6. Getting user profiles with transaction history...');
    const requesterProfile = await getUserProfileWithHistory(mockBookingData.requesterId);
    const providerProfile = await getUserProfileWithHistory(mockBookingData.providerId);
    
    console.log(`👤 Requester profile: ${requesterProfile.profile?.displayName || 'Unknown'}`);
    console.log(`💰 Requester credits: ${requesterProfile.profile?.credits || 0}`);
    console.log(`📊 Requester summary:`, requesterProfile.summary);
    
    console.log(`👤 Provider profile: ${providerProfile.profile?.displayName || 'Unknown'}`);
    console.log(`💰 Provider credits: ${providerProfile.profile?.credits || 0}`);
    console.log(`📊 Provider summary:`, providerProfile.summary);
    
    console.log('🎉 Credit transaction flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

/**
 * Test function to verify booking status flow
 */
export const testBookingStatusFlow = async () => {
  console.log('🧪 Testing Booking Status Flow...');
  
  try {
    // Test different booking statuses
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    
    for (const status of statuses) {
      console.log(`Testing status: ${status}`);
      
      const testBookingData = {
        ...mockBookingData,
        status: status as any
      };
      
      try {
        const bookingId = await createBooking(testBookingData);
        console.log(`✅ ${status} booking created: ${bookingId}`);
        
        // Only try to complete confirmed bookings
        if (status === 'confirmed') {
          const result = await completeSessionWithCredits(bookingId);
          console.log(`📝 Completion result: ${result.success ? 'Success' : 'Failed'}`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to create ${status} booking:`, error);
      }
    }
    
    console.log('🎉 Booking status flow test completed!');
    
  } catch (error) {
    console.error('❌ Booking status test failed:', error);
  }
};

/**
 * Utility function to run all tests
 */
export const runAllTests = async () => {
  console.log('🚀 Running all credit transaction tests...');
  
  await testCreditTransactionFlow();
  console.log('\n' + '='.repeat(50) + '\n');
  await testBookingStatusFlow();
  
  console.log('\n🏁 All tests completed!');
};

// Export for use in development/testing
export default {
  testCreditTransactionFlow,
  testBookingStatusFlow,
  runAllTests
};
