import React from 'react';
import { Link } from 'react-router-dom';

// ✅ Define Props Interface
interface SubcategoryTypeCellProps {
  id: string | number;
  subcategoryTypeValues: string;
}
// ✅ Functional Component for SubcategoryTypeCell
const SubcategoryTypeCell: React.FC<SubcategoryTypeCellProps> = ({
  id,
  subcategoryTypeValues,
}) => {
  return (
    // ✅ Link to navigate to a specific subcategory type
    <Link
      to={`/library/${id}`}
      style={{ color: 'blue', textDecoration: 'none', cursor: 'pointer' }}
    >
      {subcategoryTypeValues}
    </Link>
  );
};

export default SubcategoryTypeCell;
