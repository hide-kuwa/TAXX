import { Staff } from "./types";

export const STAFF_DATA: Staff[] = [
  {
    id: "s1",
    name: "田中 太郎 (第1課)",
    clients: [
      { id: "c1", name: "株式会社 鈴木商店", fiscal: 3, role: "main" },
      { id: "c2", name: "合同会社 テック", fiscal: 12, role: "main" },
      { id: "c3", name: "佐藤商事", fiscal: 9, role: "main" },
    ],
  },
  {
    id: "s2",
    name: "佐藤 次郎 (第2課)",
    clients: [
      { id: "c4", name: "鈴木 太郎 (個人)", fiscal: 12, role: "sub" },
      { id: "c5", name: "山田不動産", fiscal: 12, role: "main" },
    ],
  },
];

export const PERIODS = {
  year: ["R7", "R6", "R5", "R4"],
  month: Array.from({ length: 12 }, (_, i) => `${12 - i}月`),
};
