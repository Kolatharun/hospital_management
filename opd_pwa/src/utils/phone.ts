export const maskPhoneNumber = (phone?: string): string => {
  if (!phone || phone.length < 10) return phone || '';
  const clean = phone.replace(/\D/g, '');
  return `+91 ${clean.slice(0, 2)}**** ${clean.slice(6)}`;
};

export const formatIndianPhone = (phone?: string): string => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phone;
};
