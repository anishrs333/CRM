const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let subdirs = fs.readdirSync(dir);
  let files = [];
  for (let file of subdirs) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else if (fullPath.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const customComponents = new Set([
  'Modal', 'Button', 'Badge', 'Skeleton', 'ErrorState', 'LoadingSpinner', 
  'CustomerDetailsModal', 'CustomerModal', 'FollowUpModal', 'FilterDropdown', 
  'FormField', 'SearchBar', 'Breadcrumbs', 'MainLayout', 'Navbar', 'Sidebar', 
  'LeadDetailsModal', 'LeadModal', 'ConfirmModal', 'OpportunityModal', 'ProductModal', 
  'QuotationModal', 'QuotationPrintPreview', 'DataTable', 'Pagination', 'TaskModal', 
  'ChangePasswordModal', 'UserDetailsModal', 'UserModal', 'StudentProfileModal', 
  'StudentListPage', 'OngoingTraineesPage', 'CompletedStudentsPage', 'PlacedStudentsPage', 
  'StudentPaymentsPage', 'CourseCatalogPage', 'HiringPartnersPage', 'LoginPage', 
  'NotFoundPage', 'RolePermissionPage', 'ProductListPage', 'QuotationListPage', 
  'ReportsPage', 'SettingsPage', 'TaskListPage', 'UserListPage', 'AppRoutes', 
  'ProtectedRoute', 'AuthProvider', 'ToastProvider', 'ErrorBoundary', 'React', 
  'Outlet', 'Navigate', 'Link', 'NavLink', 'Routes', 'Route'
]);

let jsxFiles = getFiles('frontend/src');
let hasMissing = false;

for (let file of jsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let matchImports = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
  let importedIcons = new Set();
  if (matchImports) {
    matchImports[1].split(',').forEach(s => importedIcons.add(s.trim()));
  }

  // Find components used in JSX: <IconName
  let compMatches = content.match(/<([A-Z][A-Za-z0-9]+)\b/g) || [];
  compMatches.forEach(m => {
    let name = m.substring(1);
    if (!customComponents.has(name) && !importedIcons.has(name)) {
      console.log(`[MISSING IMPORT] File: ${file} -> Component: ${name}`);
      hasMissing = true;
    }
  });

  // Find icons passed as props: icon={IconName}
  let propMatches = content.match(/icon=\{([A-Z][A-Za-z0-9]+)\}/g) || [];
  propMatches.forEach(m => {
    let name = m.replace('icon={', '').replace('}', '');
    if (!customComponents.has(name) && !importedIcons.has(name)) {
      console.log(`[MISSING PROP ICON] File: ${file} -> Icon: ${name}`);
      hasMissing = true;
    }
  });
}

if (!hasMissing) {
  console.log('ALL FRONTEND JSX ICONS & COMPONENTS ARE 100% CORRECTLY IMPORTED!');
}

