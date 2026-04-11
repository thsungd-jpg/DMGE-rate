import Papa from 'papaparse';

export function exportJobsToCSV(jobs) {
  const csvData = jobs.map(job => ({
    Date: job.date,
    Category: job.category,
    Role: job.role,
    Model: job.model,
    Units: job.units || '',
    Complexity: job.complexity || '',
    Usage: job.usage || '',
    ClientType: job.clientType || '',
    Rush: job.rush ? 'Yes' : 'No',
    Revisions: job.revisions || 0,
    MaterialsCost: job.materialsCost || 0,
    Price: job.price,
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `rate_jobs_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportClientsToCSV(clients) {
  const csvData = clients.map(c => ({
    Name: c.name,
    Email: c.email || '',
    Phone: c.phone || '',
    RateMultiplier: c.rateMultiplier || 1,
    PreferredComplexity: c.preferredComplexity || '',
    PreferredUsageRights: c.preferredUsageRights || '',
    PreferredClientType: c.preferredClientType || '',
    Notes: c.notes || ''
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `rate_clients_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}