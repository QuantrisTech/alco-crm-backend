// utils/buildInvoiceFilterQuery.js
function buildInvoiceFilterQuery(filters = {}) {
  const { search, status, dateFrom, dateTo } = filters;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (dateFrom || dateTo) {
    query.dueDate = {};
    if (dateFrom) query.dueDate.$gte = new Date(dateFrom);
    if (dateTo) {
      // include the full end day
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query.dueDate.$lte = end;
    }
  }

  // search matches invoiceNumber, or populated user name/email
  // Since user is a separate collection, text search on it needs a $lookup-style approach.
  // Simplest reliable option: pre-fetch matching user ids, then $or with invoiceNumber.
  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  return query;
}

module.exports = buildInvoiceFilterQuery;