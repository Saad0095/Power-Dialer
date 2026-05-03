export default function FormSelect({ label, name, options, value, onChange, error, required = false, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 border transition focus:outline-none ${
          error 
            ? 'border-rose-500 dark:border-rose-500 focus:border-rose-400 focus:ring-rose-400' 
            : 'border-slate-300 dark:border-slate-600 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400'
        } focus:ring-1`}
        {...props}
      >
        <option value="">Select {label?.toLowerCase()}</option>
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
