import React from 'react';

export const NumberField = ({
    label,
    value,
    step,
    onChange,
    onScroll,
    disabled = false,
    className = '',
    inputClassName = '',
    labelClassName = ''
}) => {
    const handleWheel = (event) => {
        if (!onScroll) return;
        if (document.activeElement !== event.currentTarget) return;
        event.preventDefault();
        event.stopPropagation();
        onScroll(event);
    };

    return (
        <div className={`input-group ${className}`.trim()}>
            <label className={labelClassName}>{label}</label>
            <input
                type="number"
                value={value}
                step={step}
                onChange={onChange}
                onWheel={handleWheel}
                disabled={disabled}
                className={inputClassName}
            />
        </div>
    );
};

export const SelectField = ({
    label,
    value,
    onChange,
    options,
    className = '',
    selectClassName = '',
    labelClassName = ''
}) => (
    <div className={`input-group ${className}`.trim()}>
        <label className={labelClassName}>{label}</label>
        <select value={value} onChange={onChange} className={selectClassName}>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

export const TextField = ({
    label,
    value,
    onChange,
    placeholder = '',
    disabled = false,
    className = '',
    inputClassName = '',
    labelClassName = ''
}) => (
    <div className={`input-group ${className}`.trim()}>
        <label className={labelClassName}>{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
        />
    </div>
);
