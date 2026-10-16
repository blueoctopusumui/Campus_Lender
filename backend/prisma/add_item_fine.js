import prisma from '../src/prismaClient.js';

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE items 
      ADD COLUMN fine_per_day DECIMAL(8,2) NOT NULL DEFAULT 5.00
    `);
    console.log('fine_per_day column added');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('fine_per_day column already exists');
    } else {
      console.error('Error adding fine_per_day:', err.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE items 
      ADD COLUMN max_loan_days INT NOT NULL DEFAULT 7
    `);
    console.log('max_loan_days column added');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('max_loan_days column already exists');
    } else {
      console.error('Error adding max_loan_days:', err.message);
    }
  }

  // Update sp_return_loan to use item's custom fine_per_day if defined, else fallback to category fine_per_day
  try {
    await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS sp_return_loan`);
    await prisma.$executeRawUnsafe(`
      CREATE PROCEDURE sp_return_loan (
        IN p_loan_id   INT,
        IN p_condition VARCHAR(10)
      )
      BEGIN
        DECLARE v_due_date      DATE;
        DECLARE v_fine_per_day  DECIMAL(8,2);
        DECLARE v_overdue_days  INT;
        DECLARE v_fine_amount   DECIMAL(8,2);

        -- Fetch due_date and custom item fine_per_day (fallback to category fine_per_day)
        SELECT l.due_date, COALESCE(i.fine_per_day, c.fine_per_day)
          INTO v_due_date, v_fine_per_day
          FROM loans            l
          JOIN lending_requests lr ON lr.request_id = l.request_id
          JOIN items            i  ON i.item_id      = lr.item_id
          JOIN categories       c  ON c.category_id  = i.category_id
         WHERE l.loan_id = p_loan_id;

        -- Mark loan as returned
        UPDATE loans
           SET returned_at      = NOW(),
               return_condition = p_condition
         WHERE loan_id = p_loan_id;

        -- Calculate overdue days
        SET v_overdue_days = GREATEST(DATEDIFF(CURDATE(), v_due_date), 0);

        -- Insert fine record if overdue
        IF v_overdue_days > 0 THEN
          SET v_fine_amount = v_overdue_days * v_fine_per_day;
          INSERT INTO fines (loan_id, amount, is_paid)
          VALUES (p_loan_id, v_fine_amount, FALSE);
        END IF;
      END
    `);
    console.log('sp_return_loan updated with custom lender fine rate support');
  } catch (err) {
    console.error('Error updating sp_return_loan:', err.message);
  }

  process.exit(0);
}

main();
