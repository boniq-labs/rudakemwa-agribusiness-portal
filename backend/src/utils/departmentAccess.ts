const departmentRoleMap: Record<string, string> = {
  animal: 'procurement',
  milk: 'veterinary',
  crops: 'sales',
  logistics: 'hr',
};

const reverseMap: Record<string, string> = {};
for (const [prime, extra] of Object.entries(departmentRoleMap)) {
  reverseMap[extra] = prime;
}

export function getAdditionalDepartments(role: string): string[] {
  const extra = departmentRoleMap[role];
  return extra ? [extra] : [];
}

export function getPrimaryRolesForDepartment(departmentRole: string): string[] {
  const roles = [departmentRole];
  if (reverseMap[departmentRole]) {
    roles.push(reverseMap[departmentRole]);
  }
  return roles;
}

export function canAccessDepartment(userRole: string, targetDepartmentRole: string): boolean {
  if (userRole === targetDepartmentRole) return true;
  return departmentRoleMap[userRole] === targetDepartmentRole;
}
