# Quick Fixes for IMS Test Scenarios

## 1. Contact Number Validation (TC018)
```typescript
// Add to CreateBill.tsx form validation
const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// In Form.Item rules:
rules={[
  { required: true, message: 'Please enter contact' },
  { 
    validator: (_, value) => {
      if (value && !validatePhoneNumber(value)) {
        return Promise.reject('Invalid contact number - must be 10 digits');
      }
      return Promise.resolve();
    }
  }
]}
```

## 2. State Field Alphabets Only (TC019)
```typescript
// Add validation for state field
const validateAlphabetsOnly = (text: string): boolean => {
  const alphabetRegex = /^[a-zA-Z\s]*$/;
  return alphabetRegex.test(text);
};

// In state field:
rules={[
  { 
    validator: (_, value) => {
      if (value && !validateAlphabetsOnly(value)) {
        return Promise.reject('State field accepts only alphabets');
      }
      return Promise.resolve();
    }
  }
]}
```

## 3. Account Lockout Mechanism (TC022)
```typescript
// Add to Login.tsx
const [failedAttempts, setFailedAttempts] = useState(0);
const [isLocked, setIsLocked] = useState(false);
const [lockoutTime, setLockoutTime] = useState<number | null>(null);

const handleFailedLogin = () => {
  const newAttempts = failedAttempts + 1;
  setFailedAttempts(newAttempts);
  
  if (newAttempts >= 3) {
    setIsLocked(true);
    const lockTime = Date.now() + (15 * 60 * 1000); // 15 minutes
    setLockoutTime(lockTime);
    localStorage.setItem('lockoutTime', lockTime.toString());
    setError('Account locked due to multiple failed attempts. Try again in 15 minutes.');
  }
};
```

## 4. Required Field Indicators (TC045)
```typescript
// Add asterisk to required fields
<Form.Item
  name="customerName"
  label={<span>Customer Name <span style={{color: 'red'}}>*</span></span>}
  rules={[{ required: true, message: 'Please input or select a customer!' }]}
>
```

## 5. Sale Price vs Inward Price Warning (TC027)
```typescript
// Add validation in CreateBill.tsx
const checkPriceWarning = (salePrice: number, inwardPrice: number) => {
  if (salePrice < inwardPrice) {
    message.warning('Sale price is less than cost price');
  }
};
```

## 6. Enhanced Discount Validation (TC024)
```typescript
const handleDiscountChange = (key: string, value: number) => {
  if (value < 0) {
    message.error('Discount cannot be negative');
    return;
  }
  if (value > 100) {
    message.error('Discount cannot exceed 100%');
    return;
  }
  // ... rest of the logic
};
```

## 7. Button State Management (TC046)
```typescript
// In CreateBill.tsx
const [isBillSaved, setIsBillSaved] = useState(false);

<Button
  type="primary"
  onClick={handlePrint}
  disabled={!isBillSaved || selectedProducts.length === 0}
  style={{ 
    backgroundColor: isBillSaved ? '#52c41a' : '#d9d9d9',
    borderColor: isBillSaved ? '#52c41a' : '#d9d9d9'
  }}
>
  Print Bill
</Button>
```

## 8. Network Error Handling Enhancement (TC030)
```typescript
// Improve error handling in Login.tsx
catch (err: unknown) {
  if (!navigator.onLine) {
    setError('No internet connection. Please check your network.');
  } else if (err instanceof Error) {
    if (err.message.includes('timeout')) {
      setError('Request timeout. Please try again.');
    } else if (err.message.includes('500')) {
      setError('Server error. Please try again later.');
    } else {
      setError('Login failed. Please check your credentials.');
    }
  }
}
```

## Implementation Order:
1. Contact number validation (5 minutes)
2. State field validation (3 minutes)
3. Required field indicators (10 minutes)
4. Enhanced discount validation (5 minutes)
5. Account lockout mechanism (30 minutes)
6. Sale price warning (10 minutes)
7. Button state management (15 minutes)
8. Network error handling (10 minutes)

**Total Implementation Time: ~1.5 hours**