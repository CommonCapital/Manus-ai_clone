import React from 'react';

interface ButtonProps {
  /**
   * The button label text
   */
  label: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Button variant style
   */
  variant?: 'primary' | 'secondary' | 'danger';
  /**
   * Disable the button
   */
  disabled?: boolean;
}

/**
 * A reusable Button component
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';

  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed';

  const buttonStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${disabled ? disabledStyles : ''}
  `.trim();

  return (
    <button
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;