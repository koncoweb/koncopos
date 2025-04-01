import { Transaction } from "../components/TransactionHistory";

const initialTransactions: Transaction[] = [
  {
    id: "TX-1001",
    date: "2023-06-15",
    time: "14:30",
    amount: 124.99,
    staffMember: "John Doe",
    status: "completed",
  },
  {
    id: "TX-1002",
    date: "2023-06-15",
    time: "15:45",
    amount: 67.5,
    staffMember: "Jane Smith",
    status: "completed",
  },
  {
    id: "TX-1003",
    date: "2023-06-14",
    time: "10:15",
    amount: 89.99,
    staffMember: "John Doe",
    status: "refunded",
  },
  {
    id: "TX-1004",
    date: "2023-06-14",
    time: "16:20",
    amount: 45.75,
    staffMember: "Mike Johnson",
    status: "completed",
  },
  {
    id: "TX-1005",
    date: "2023-06-13",
    time: "11:05",
    amount: 199.99,
    staffMember: "Jane Smith",
    status: "pending",
  },
];

export default initialTransactions;
