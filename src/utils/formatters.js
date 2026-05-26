export const formatters = {
  date: (dateString) => new Date(dateString).toLocaleDateString('fa-IR'),
  currency: (amount) => amount.toLocaleString('fa-IR') + ' تومان',
  phone: (phone) => phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3'),
};
