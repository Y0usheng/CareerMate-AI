const Field = ({ label }) => (
    <div>
        <div className="mb-2">
            <label className="text-sm text-gray-700">
                {label}
            </label>
        </div>
        <br />
        <div>
            <input className="px-4 py-2 rounded-3xl border border-gray-300 w-full" />
        </div>
    </div >
)

export default Field;