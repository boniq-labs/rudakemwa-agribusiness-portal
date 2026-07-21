const fs = require('fs');
let c = fs.readFileSync('backend/src/routes/index.ts', 'utf8');
const replacement = `      ORDER BY a.created_at DESC LIMIT 5
    \`);
    const { success } = await import('../utils/response');
    return success(res, rows);
  } catch (err: any) {
    const { error } = await import('../utils/response');
    return error(res, err.message);
  }
});

router.get('/veterinary/dashboard', authenticate, async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [rows_openHealthRecords]: any = await pool.query("SELECT COUNT(*) as c FROM animal_health_records");
    const openHealthRecords = rows_openHealthRecords[0].c;
    const [rows_vaccinationsDue]: any = await pool.query("SELECT COUNT(*) as c FROM vaccinations WHERE next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
    const vaccinationsDue = rows_vaccinationsDue[0].c;
    const [rows_treatmentsPending]: any = await pool.query("SELECT COUNT(*) as c FROM treatments");
    const treatmentsPending = rows_treatmentsPending[0].c;
    const { success } = await import('../utils/response');
    return success(res, { openHealthRecords, vaccinationsDue, treatmentsPending });
  } catch (err: any) {
    const { error } = await import('../utils/response');
    return error(res, err.message);
  }
});`;
c = c.replace(/      ORDER BY a\.created_at DESC LIMIT 5\n    `\);\n\}\);/, replacement);
fs.writeFileSync('backend/src/routes/index.ts', c);
