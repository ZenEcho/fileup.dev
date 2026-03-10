interface UseDateFormatOptions {
  locale?: string;
}

export function useDateFormat(options: UseDateFormatOptions = {}) {
  const { locale } = options;

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return locale ? date.toLocaleString(locale) : date.toLocaleString();
  };

  const isToday = (value?: string | null) => {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const formatNumber = (value: number) => {
    if (!Number.isFinite(value)) {
      return '0';
    }
    return new Intl.NumberFormat(locale).format(value);
  };

  return {
    formatDateTime,
    isToday,
    formatNumber,
  };
}
