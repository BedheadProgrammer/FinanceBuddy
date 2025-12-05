import React from "react";
import { Grid, TableCell } from "@mui/material";
import { colors, typography } from "../../constants/theme";

export const GridItem = (props: any) => <Grid {...props} />;

type StyledTableCellProps = {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  isHeader?: boolean;
  isNumber?: boolean;
  sx?: object;
  [key: string]: any;
};

export const StyledTableCell: React.FC<StyledTableCellProps> = ({
  children,
  align = "left",
  isHeader = false,
  isNumber = false,
  sx,
  ...props
}) => (
  <TableCell
    align={align}
    sx={{
      py: 2,
      px: 2,
      fontFamily: isNumber ? typography.mono : typography.sans,
      fontSize: isHeader ? "0.75rem" : "0.875rem",
      fontWeight: isHeader ? 600 : 400,
      color: isHeader ? colors.textSecondary : colors.textPrimary,
      textTransform: isHeader ? "uppercase" : "none",
      letterSpacing: isHeader ? "0.05em" : "normal",
      borderBottom: `1px solid ${colors.border}`,
      whiteSpace: "nowrap",
      ...sx,
    }}
    {...props}
  >
    {children}
  </TableCell>
);
