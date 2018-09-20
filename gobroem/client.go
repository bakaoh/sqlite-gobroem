package gobroem

import (
	"bytes"
	"database/sql"
	"encoding/csv"
	"fmt"
	"reflect"

	// include sqlite
	_ "github.com/mattn/go-sqlite3"
)

const (
	queryInfo         = `SELECT * FROM (SELECT COUNT (*) AS count FROM sqlite_master WHERE type='table') AS count_tables, (SELECT COUNT (*) AS count FROM sqlite_master WHERE type='index') AS count_indexes;`
	queryTables       = `SELECT name FROM sqlite_master WHERE type='table';`
	queryTableSchema  = `PRAGMA table_info(%s);`
	queryTableInfo    = `SELECT COUNT(*) FROM %s;`
	queryTableSQL     = `SELECT sql FROM sqlite_master WHERE type='table' AND name='%s'`
	queryTableIndexes = `SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='%s'`
)

// sqlClient is a wrapper around sqlx.DB
type sqlClient struct {
	*sql.DB
}

type sqlRow []interface{}

type sqlResult struct {
	Columns []string `json:"columns"`
	Rows    []sqlRow `json:"rows"`
}

func newClient(file string) (*sqlClient, error) {
	db, err := sql.Open("sqlite3", file)
	if err != nil {
		return nil, err
	}
	return &sqlClient{db}, nil
}

func newClientFromDB(db *sql.DB) (*sqlClient, error) {
	return &sqlClient{db}, nil
}

func (client *sqlClient) Info() (*sqlResult, error) {
	return client.query(queryInfo)
}

func (client *sqlClient) Tables() ([]string, error) {
	return client.fetchRows(queryTables)
}

func (client *sqlClient) TableInfo(table string) (*sqlResult, error) {
	return client.query(fmt.Sprintf(queryTableInfo, table))
}

// Table returns the table structure.
func (client *sqlClient) Table(table string) (*sqlResult, error) {
	return client.query(fmt.Sprintf(queryTableSchema, table))
}

// TableSQL returns the SQL used to create the given table.
func (client *sqlClient) TableSQL(table string) ([]string, error) {
	return client.fetchRows(fmt.Sprintf(queryTableSQL, table))
}

// TableIndexes returns the indexes for the given table.
func (client *sqlClient) TableIndexes(table string) (*sqlResult, error) {
	return client.query(fmt.Sprintf(queryTableIndexes, table))
}

func (client *sqlClient) QuerySQL(query string) (*sqlResult, error) {
	return client.query(query)
}

func (client *sqlClient) query(query string, args ...interface{}) (*sqlResult, error) {
	rows, err := client.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	result := &sqlResult{Columns: columns}

	for rows.Next() {
		cols, err := SliceScan(rows)
		if err != nil {
			continue
		}

		for i, item := range cols {
			if item == nil {
				cols[i] = nil
			} else {
				t := reflect.TypeOf(item).Kind().String()

				if t == "slice" {
					cols[i] = string(item.([]byte))
				}
			}
		}

		result.Rows = append(result.Rows, cols)
	}

	return result, nil
}

// SliceScan a row, returning a []interface{} with values similar to MapScan.
// This function is primarily intended for use where the number of columns
// is not known.  Because you can pass an []interface{} directly to Scan,
// it's recommended that you do that as it will not have to allocate new
// slices per row.
func SliceScan(r *sql.Rows) ([]interface{}, error) {
	// ignore r.started, since we needn't use reflect for anything.
	columns, err := r.Columns()
	if err != nil {
		return []interface{}{}, err
	}

	values := make([]interface{}, len(columns))
	for i := range values {
		values[i] = new(interface{})
	}

	err = r.Scan(values...)

	if err != nil {
		return values, err
	}

	for i := range columns {
		values[i] = *(values[i].(*interface{}))
	}

	return values, r.Err()
}

// fetchRows return a string slice of all rows for the first column in the
// query result.
func (client *sqlClient) fetchRows(query string) ([]string, error) {
	res, err := client.query(query)
	if err != nil {
		return nil, err
	}

	// Init empty slice; otherwise JSON marshal will encode it to "null"
	results := make([]string, 0)

	for _, row := range res.Rows {
		results = append(results, row[0].(string))
	}

	return results, nil
}

// Format returns a slice of maps. The key in the map represents the column name
// and the value is the row content.
func (res *sqlResult) Format() []map[string]interface{} {
	var items []map[string]interface{}

	for _, row := range res.Rows {
		item := make(map[string]interface{})
		for i, c := range res.Columns {
			item[c] = row[i]
		}

		items = append(items, item)
	}

	return items
}

func (res *sqlResult) CSV() []byte {
	buf := new(bytes.Buffer)
	writer := csv.NewWriter(buf)

	// Write the header
	writer.Write(res.Columns)

	// Write the values
	for _, row := range res.Rows {
		record := make([]string, len(row))

		for i, val := range row {
			var v string
			if val != nil {
				v = fmt.Sprintf("%v", val)
			} else {
				v = ""
			}
			record[i] = v
		}
		writer.Write(record)
	}

	return buf.Bytes()
}
