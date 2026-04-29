import csv
import json
import os
import shutil
from collections import defaultdict

def prepare_nosql_documents():
    # 1. Ensure a clean output directory
    output_dir = 'documents'
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    # 2. Load Customers
    customers = {}
    with open('customers.csv', mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['accounts'] = []
            row['transactions'] = []
            customers[row['customer_id']] = row

    # 3. Load Accounts and create account_to_customer mapping
    account_to_customer = {}
    with open('accounts.csv', mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            customer_id = row.pop('customer_id') # Remove redundant customer_id
            account_id = row['account_id']
            account_to_customer[account_id] = customer_id
            
            try:
                row['balance'] = float(row['balance'])
            except ValueError:
                pass
                
            if customer_id in customers:
                customers[customer_id]['accounts'].append(row)

    # 4. Load Transactions
    with open('transactions.csv', mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            account_id = row['account_id']
            customer_id = account_to_customer.get(account_id)
            
            if customer_id and customer_id in customers:
                try:
                    row['amount'] = float(row['amount'])
                except ValueError:
                    pass
                customers[customer_id]['transactions'].append(row)

    # 5. Sort transactions and write individual JSON files
    print(f"Generating documents in {output_dir}/...")
    count = 0
    for customer_id, data in customers.items():
        # Sort transactions by date descending
        data['transactions'].sort(key=lambda x: x['date'], reverse=True)
        
        file_path = os.path.join(output_dir, f'customer_{customer_id}.json')
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        count += 1

    print(f"Successfully created {count} customer documents.")

if __name__ == "__main__":
    prepare_nosql_documents()
