import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${className} ${isLoading ? 'loading' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="spinner"></span> : children}
    </button>
  );
};

export default Button;
