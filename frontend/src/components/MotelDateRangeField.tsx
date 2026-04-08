import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";

interface MotelDateRangeFieldProps {
  checkIn: string;
  checkOut: string;
  compact?: boolean;
  label?: string;
  onChange: (value: { checkIn: string; checkOut: string }) => void;
}

const WEEK_DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

function buildMonthGrid(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

export function MotelDateRangeField({
  checkIn,
  checkOut,
  compact = false,
  label = "Fecha de entrada — Fecha de salida",
  onChange,
}: MotelDateRangeFieldProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseISO(checkIn)));

  const checkInDate = useMemo(() => (checkIn ? parseISO(checkIn) : null), [checkIn]);
  const checkOutDate = useMemo(() => (checkOut ? parseISO(checkOut) : null), [checkOut]);
  const secondMonth = addMonths(visibleMonth, 1);

  const selectDate = (day: Date) => {
    const selected = format(day, "yyyy-MM-dd");

    if (!checkInDate || (checkInDate && checkOutDate)) {
      onChange({ checkIn: selected, checkOut: "" });
      return;
    }

    if (isBefore(day, checkInDate) || isSameDay(day, checkInDate)) {
      onChange({ checkIn: selected, checkOut: "" });
      return;
    }

    onChange({ checkIn, checkOut: selected });
    setAnchorEl(null);
  };

  const renderMonth = (month: Date) => {
    const weeks = buildMonthGrid(month);

    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography align="center" fontWeight={800} mb={2} variant="h6">
          {format(month, "MMMM yyyy", { locale: es })}
        </Typography>

        <div className="grid grid-cols-7 gap-y-2 text-center">
          {WEEK_DAYS.map((day) => (
            <Typography color="text.secondary" key={day} variant="body2">
              {day}
            </Typography>
          ))}

          {weeks.flat().map((day) => {
            const isStart = checkInDate ? isSameDay(day, checkInDate) : false;
            const isEnd = checkOutDate ? isSameDay(day, checkOutDate) : false;
            const isInRange =
              checkInDate &&
              checkOutDate &&
              isAfter(day, checkInDate) &&
              isBefore(day, checkOutDate);

            return (
              <ButtonBase
                key={day.toISOString()}
                onClick={() => selectDate(day)}
                sx={{
                  alignItems: "center",
                  borderRadius: "999px",
                  color: isSameMonth(day, month) ? "#0f172a" : "#94a3b8",
                  display: "flex",
                  height: 38,
                  justifyContent: "center",
                  width: 38,
                  mx: "auto",
                  backgroundColor: isStart || isEnd ? "#1d4ed8" : isInRange ? "#dbeafe" : "transparent",
                  fontWeight: isStart || isEnd ? 700 : 500,
                }}
              >
                <Typography
                  sx={{
                    color: isStart || isEnd ? "white" : "inherit",
                    fontWeight: isStart || isEnd ? 800 : 500,
                  }}
                >
                  {format(day, "d")}
                </Typography>
              </ButtonBase>
            );
          })}
        </div>
      </Box>
    );
  };

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          alignItems: compact ? "center" : "flex-start",
          border: compact ? "none" : "1px solid #e5e7eb",
          borderRadius: compact ? "14px" : "18px",
          display: "flex",
          gap: 1.5,
          justifyContent: "flex-start",
          minHeight: compact ? 52 : 70,
          px: 2,
          py: compact ? 1.25 : 1.5,
          width: "100%",
        }}
      >
        <CalendarMonthOutlinedIcon sx={{ color: "#64748b" }} />
        <Box textAlign="left">
          {!compact && (
            <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
              Fechas
            </Typography>
          )}
          <Typography fontWeight={compact ? 600 : 700}>
            {checkInDate && checkOutDate
              ? `${format(checkInDate, "d MMM", { locale: es })} — ${format(checkOutDate, "d MMM", { locale: es })}`
              : label}
          </Typography>
        </Box>
      </ButtonBase>

      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        onClose={() => setAnchorEl(null)}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              mt: 1.5,
              overflow: "hidden",
              width: { md: 820, xs: "calc(100vw - 24px)" },
            },
          },
        }}
      >
        <Box p={3}>
          <div className="flex items-center justify-between gap-3">
            <Stack direction="row" spacing={2}>
              <Button sx={{ fontWeight: 700 }} variant="text">
                Calendario
              </Button>
              <Button color="inherit" sx={{ fontWeight: 500 }} variant="text">
                Fechas flexibles
              </Button>
            </Stack>

            <Stack direction="row" spacing={1}>
              <IconButton onClick={() => setVisibleMonth((current) => addMonths(current, -1))}>
                <ChevronLeftRoundedIcon />
              </IconButton>
              <IconButton onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>
                <ChevronRightRoundedIcon />
              </IconButton>
            </Stack>
          </div>

          <Divider sx={{ my: 2 }} />

          <div className="grid gap-8 md:grid-cols-2">
            {renderMonth(visibleMonth)}
            {renderMonth(secondMonth)}
          </div>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <Chip color="primary" label="Fechas exactas" variant="outlined" />
            <Chip label="± 1 día" variant="outlined" />
            <Chip label="± 2 días" variant="outlined" />
            <Chip label="± 3 días" variant="outlined" />
            <Chip label="± 7 días" variant="outlined" />
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
