import React from 'react';
import { Icon } from "@iconify/react";

function getPageNumbers(current, totalPages) {
  // Always show first, last, current, and up to 2 before/after current
  // Use ellipsis if there is a gap
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (current >= totalPages - 3) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
  }
  return pages;
}

export default function SubnamesPaginationControls({ 
  pagination, 
  onPageChange,
  isLoading 
}) {
  const { offset, limit, total, totalPages } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const lastPage = totalPages || Math.ceil(total / limit);
  const pageNumbers = getPageNumbers(currentPage, lastPage);

  const handlePageClick = (page) => {
    if (isLoading || page === '...' || page < 1 || page > lastPage) return;
    onPageChange((page - 1) * limit);
  };

  if (totalPages === 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-1 md:border-l md:border-r md:border-b md:border-neutral-200 md:rounded-b-lg">
      {pageNumbers.map((page, idx) =>
        page === '...'
          ? <span key={idx} className="mx-1 px-2 text-gray-400">...</span>
          : (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              disabled={isLoading || page === currentPage}
              className={`mx-1 px-3 py-1 rounded border ${page === currentPage
                ? 'border-orange-400 text-orange-500 bg-orange-50 font-semibold'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'} ${isLoading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`}
            >
              {page}
            </button>
          )
      )}
    </div>
  );
}
