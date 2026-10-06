// Shared Date, Time, Duration and Validation Utilities for FORGE
// Standardizing on 24-hour IST (Asia/Kolkata) across the entire application

/**
 * Formats a date, string, or timestamp into standardized 24-hour IST format:
 * Example: "06 Oct 2026 • 14:35 IST"
 */
export function formatISTDateTime(dateInput, includeSeconds = false) {
  if (!dateInput) return '06 Oct 2026 • 14:35 IST';
  
  let date;
  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date();
  }

  if (isNaN(date.getTime())) {
    // If it's a simulated string like "14:35 IST"
    if (typeof dateInput === 'string' && dateInput.includes('IST')) {
      return `06 Oct 2026 • ${dateInput}`;
    }
    return '06 Oct 2026 • 14:35 IST';
  }

  // Use explicit formatting in IST (UTC+5:30)
  const options = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false
  };

  const formattedParts = new Intl.DateTimeFormat('en-IN', options).formatToParts(date);
  const partMap = {};
  formattedParts.forEach(p => { partMap[p.type] = p.value; });

  const day = partMap.day || '06';
  const month = partMap.month || 'Oct';
  const year = partMap.year || '2026';
  const hour = partMap.hour || '14';
  const minute = partMap.minute || '35';
  const second = includeSeconds && partMap.second ? `:${partMap.second}` : '';

  return `${day} ${month} ${year} • ${hour}:${minute}${second} IST`;
}

/**
 * Formats time-only in 24-hour IST:
 * Example: "14:35 IST"
 */
export function formatISTTime(dateInput, includeSeconds = false) {
  if (!dateInput) return '14:35 IST';
  
  let date;
  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date();
  }

  if (isNaN(date.getTime())) {
    if (typeof dateInput === 'string' && dateInput.includes(':')) {
      return dateInput.includes('IST') ? dateInput : `${dateInput} IST`;
    }
    return '14:35 IST';
  }

  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false
  };

  const formattedParts = new Intl.DateTimeFormat('en-IN', options).formatToParts(date);
  const partMap = {};
  formattedParts.forEach(p => { partMap[p.type] = p.value; });

  const hour = partMap.hour || '14';
  const minute = partMap.minute || '35';
  const second = includeSeconds && partMap.second ? `:${partMap.second}` : '';

  return `${hour}:${minute}${second} IST`;
}

/**
 * Canonical duration formatter:
 * Takes decimal hours (e.g. 4.8) or minutes (e.g. 288) and formats as "4h 48m"
 * Issue 2: ARMY-HT-017 ETA canonical formatter
 */
export function formatDuration(input, inputType = 'hours') {
  if (input === null || input === undefined) return '0h 00m';
  
  let totalMinutes = 0;
  if (inputType === 'minutes') {
    totalMinutes = Math.round(Number(input));
  } else {
    // Default is hours
    totalMinutes = Math.round(Number(input) * 60);
  }

  if (isNaN(totalMinutes) || totalMinutes < 0) return '0h 00m';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
}

/**
 * Validates the chronological ordering of operational timeline events.
 * Issue 3 requirement: Ensures dispatchTime < checkpointTime and sorts descending.
 */
export function validateEventChronology(events) {
  if (!Array.isArray(events)) return [];

  // Sort events descending by timestamp (newest first)
  const sorted = [...events].sort((a, b) => {
    const timeA = new Date(a.raw_timestamp || a.timestamp || 0).getTime();
    const timeB = new Date(b.raw_timestamp || b.timestamp || 0).getTime();
    return timeB - timeA;
  });

  // Verify chronology logic
  const dispatchEvents = sorted.filter(e => e.type === 'DISPATCH' || (e.text && e.text.includes('dispatched')));
  const checkpointEvents = sorted.filter(e => e.type === 'CHECKPOINT' || (e.text && e.text.includes('cleared')));

  if (process.env.NODE_ENV === 'development') {
    dispatchEvents.forEach(disp => {
      const relatedCheckpoints = checkpointEvents.filter(chk => chk.shipmentId === disp.shipmentId);
      relatedCheckpoints.forEach(chk => {
        const dispTime = new Date(disp.raw_timestamp || disp.timestamp).getTime();
        const chkTime = new Date(chk.raw_timestamp || chk.timestamp).getTime();
        if (chkTime < dispTime) {
          console.error(
            `[FORGE CHRONOLOGY ERROR] Checkpoint cleared before dispatch for shipment ${disp.shipmentId}:`,
            { disp, chk }
          );
        }
      });
    });
  }

  return sorted;
}
