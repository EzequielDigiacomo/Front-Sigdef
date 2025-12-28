import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  icon: Icon,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}  ${isLoading ? 'loading' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="spinner"></span>
      ) : (
        <>
          {Icon && <Icon size={18} className={children ? "icon-spacing" : ""} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
