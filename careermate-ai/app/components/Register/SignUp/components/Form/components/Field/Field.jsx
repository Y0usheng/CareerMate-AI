const Field = ({ label, ...props }) => (
    <div>
        <div className="mb-2">
            <label className="text-sm text-gray-700">
                {label}
            </label>
        </div>
        <div>
            <input
                className="px-4 h-12 py-2 rounded-3xl border border-gray-300 w-full"
                {...props}
            />
        </div>
    </div >
)

export default Field;