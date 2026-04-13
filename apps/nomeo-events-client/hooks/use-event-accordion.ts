import { useState } from "react";

export const useEventAccordion = () => {
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);

  const toggleAccordion = (id: number | null) => {
    setOpenAccordionId(openAccordionId === id ? null : id);
  };

  return { openAccordionId, toggleAccordion };
};