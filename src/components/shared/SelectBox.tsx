import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { FiArrowRight } from "react-icons/fi";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectBoxProps {
  id?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
}

export function SelectBox({
  id,
  value,
  options,
  placeholder = "انتخاب...",
  disabled = false,
  onChange,
  className = "",
}: SelectBoxProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const displayLabel = selectedOption?.label ?? placeholder;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (open && rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handleOutsideClick);
    return () => window.removeEventListener("pointerdown", handleOutsideClick);
  }, [open]);

  function handleToggle() {
    if (disabled) return;
    setOpen((current) => !current);
  }

  function handleSelect(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      setTimeout(() => {
        listRef.current?.querySelector<HTMLElement>("li:not([aria-disabled='true'])")?.focus();
      }, 0);
    }
  }

  return (
    <div ref={rootRef} className={`relative w-full text-left ${className}`}>
      <button
        id={id}
        type="button"
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-2)] px-4 py-3 pr-10 text-sm text-[var(--color-text)] outline-none transition duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)] focus:border-[var(--color-border-strong)] focus:ring-4 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className={`inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${selectedOption ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
          {displayLabel}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center justify-center">
            <FiArrowRight />
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-activedescendant={selectedOption?.value}
          tabIndex={-1}
          className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2 shadow-[0_30px_70px_rgba(0,0,0,0.18)]"
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              tabIndex={option.disabled ? -1 : 0}
              onClick={() => handleSelect(option)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSelect(option);
                }
              }}
              className={`cursor-pointer rounded-2xl px-4 py-3 text-sm transition duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                option.disabled
                  ? "cursor-not-allowed text-[var(--color-text-muted)] opacity-60"
                  : option.value === value
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-text)] font-[700]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-panel-3)] hover:text-[var(--color-text)]"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
