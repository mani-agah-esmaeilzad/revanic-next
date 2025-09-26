// src/components/Pagination.tsx
"use client";

import {
  Pagination as ShadPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";
import { FC } from "react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export const Pagination: FC<PaginationProps> = ({ totalPages, currentPage }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    // FIX: Convert read-only searchParams to a string first
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  const renderPageNumbers = () => {
    const pageNumbers = [];
    pageNumbers.push(
      <PaginationItem key={1}>
        <PaginationLink href={createPageURL(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (currentPage > 3) {
      pageNumbers.push(<PaginationEllipsis key="start-ellipsis" />);
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink href={createPageURL(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage < totalPages - 2) {
      pageNumbers.push(<PaginationEllipsis key="end-ellipsis" />);
    }

    if (totalPages > 1) {
      pageNumbers.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href={createPageURL(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pageNumbers;
  };


  return (
    <ShadPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
            className={currentPage === 1 ? "pointer-events-none text-muted-foreground" : ""}
          />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? createPageURL(currentPage + 1) : "#"}
            className={currentPage === totalPages ? "pointer-events-none text-muted-foreground" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadPagination>
  );
};