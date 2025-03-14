/**
 * WhiteInput component
 * 
 * This component is a styled input field with a label.
 * It is used to collect user input in a white background.
 * 
 * @param {string} labelText - The text to display as the label.
 * @param {string} placeholderText - The text to display as the placeholder.
 * @param {string} value - The value of the input field.
 * @param {function} onChange - The function to call when the input value changes.
 * 
 * @returns {React.ReactElement} A React component.
*/
export function WhiteInput({ labelText, placeholderText, value, onChange }) {
    return (
      <div className="flex flex-col items-start w-full max-w-md mb-6">
        <label
          htmlFor="name-input"
          className="mb-1 text-sm font-bold text-neutral-900"
        >
          {labelText}
        </label>
        <input
          type="text"
          id={labelText.toLowerCase()}
          placeholder={placeholderText}
          value={value}
          onChange={onChange}
          className="w-full h-12 p-4 border-neutral-300 border rounded-lg appearance-none focus:ring focus:ring-orange-400/[0.5] focus:outline-none"
        />
      </div>
    );
  }