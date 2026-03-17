import { useContext } from "react";

import { TableContext } from "../context/TableContext";

export const useTable = () => useContext(TableContext);
