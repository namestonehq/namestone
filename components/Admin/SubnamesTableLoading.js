export default function SubnamesTableLoading() {
  return (
    <div className="w-full">
      <div className="overflow-hidden border rounded-lg border-1 border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr className="bg-neutral-100">
              <th className="px-6 py-3 text-left">
                <span className="text-sm font-bold text-brownblack-700">
                  Subname
                </span>
                <span className="pl-2 text-xs font-normal text-brownblack-700">
                  Total: -
                </span>
              </th>
              <th className="px-6 py-3 text-sm font-bold text-left text-brownblack-700">
                Address
              </th>
              <th className="px-6 py-3 text-sm font-bold text-left text-brownblack-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {[...Array(8)].map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-1/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="mx-1">.</div>
                    <div className="w-1/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="px-6 py-2">
                  <div className="flex space-x-4">
                    <div className="w-10 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
