export const idsToStrings = (item) => ({
  ...item,
  id: item._id.toString()
});
