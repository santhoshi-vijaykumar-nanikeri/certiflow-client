import React from 'react';
import HomePage from '../pages/private/HomePage';
import Categories from '../pages/private/Categories';
import Library from '../pages/private/Library/Library';
import Users from '../pages/private/Users';
import UserTemplates from '../pages/private/UserTemplates';
import DraftTemplates from '../pages/private/DraftTemplates';
import ComposeTemplates from '../pages/private/ComposeTemplates';
import Subcategories from '../pages/private/Subcategories';
import TemplateDetails from '../pages/private/TemplateDetails';
import AccessGuard from 'src/components/AccessGuard';

export const privateRoutes = [
  { path: '/home', element: <HomePage /> },
  {
    path: '/home/categories/view-all',
    element: (
      <AccessGuard allowedCategories={[1]}>
        <Categories />
      </AccessGuard>
    ),
  },
  {
    path: '/home/categories/:categoryId',
    element: (
      <AccessGuard allowedCategories={[1]}>
        <Subcategories />
      </AccessGuard>
    ),
  },
  { path: '/home/library', element: <Library /> },
  { path: '/home/templates/view-all', element: <ComposeTemplates /> },
  { path: '/home/templates/:id', element: <TemplateDetails /> },
  { path: '/home/draft-templates', element: <DraftTemplates /> },
  { path: '/home/user-templates/view-all', element: <UserTemplates /> },
  {
    path: '/home/users',
    element: <Users />,
  },
];
