var addHeadersToResultTable, addRowsToResultTable, apiCall, buildResultHeader, buildResultRow, buildTableContent, buildTableQueryResult, buildTableStructure, bytesToSize, executeQuery, exportCSV, exportJSON, getColumnsFromIndexSql, getInfo, getQuery, getTable, getTableContent, getTableIndexes, getTableInfo, getTableSql, getTables, loadTables, resetResultTable, runQuery, setActiveTab, showDatabaseInfo, showTableContent, showTableInfo, showTableQuery, showTableStructure;

apiCall = function(method, path, params, cb) {
  return $.ajax({
    url: apiRoot + path,
    type: method,
    data: params,
    cache: false,
    error: function(xhr, status, data) {
      console.log(xhr.responseText);
      return cb($.parseJSON(xhr.responseText));
    },
    success: function(data) {
      return cb(data);
    }
  });
};

getInfo = function(cb) {
  return apiCall('GET', 'api/info', {}, cb);
};

getTables = function(cb) {
  return apiCall('GET', 'api/tables', {}, cb);
};

getTableInfo = function(table, cb) {
  return apiCall('GET', 'api/table/info', {
    table: table
  }, cb);
};

getTable = function(table, cb) {
  return apiCall('GET', 'api/table', {
    table: table
  }, cb);
};

getTableSql = function(table, cb) {
  return apiCall('GET', 'api/table/sql', {
    table: table
  }, cb);
};

getTableIndexes = function(table, cb) {
  return apiCall('GET', 'api/table/indexes', {
    table: table
  }, cb);
};

getTableContent = function(table, cb) {
  var query;
  query = 'SELECT * FROM ' + table + ';';
  return executeQuery(query, cb);
};

getQuery = function(query, cb) {
  return executeQuery(query, cb);
};

executeQuery = function(query, cb) {
  var data;
  data = {
    query: query
  };
  return apiCall('POST', 'api/query', data, cb);
};

buildTableStructure = function(name, cb) {
  return getTableSql(name, function(data) {
    $('#structure_sql').text(data.sql);
    return getTable(name, function(columns) {
      $('#table_columns tbody').empty();
      columns.forEach(function(item) {
        var column, def_val;
        column = '<tr>';
        column += '<th>' + item.name + '</th>';
        column += '<th>' + item.type + '</th>';
        column += '<th>' + (item.pk ? 'True' : 'False') + '</th>';
        column += '<th>' + (item.notnull ? 'True' : 'False') + '</th>';
        def_val = item.dflt_value === null ? 'Null' : item.dflt_value;
        column += '<th>' + def_val + '</th>';
        column += '</tr>';
        return $('#table_columns tbody').append(column);
      });
      return getTableIndexes(name, function(columns) {
        $('#table_indexes tbody').empty();
        if ((columns == null) || columns.length < 1) {
          return cb();
        }
        columns.forEach(function(item) {
          if (!item.sql) item.sql = "";
          var cols, column, pre, sqlLink, unique;
          column = '<tr>';
          column += '<th>' + item.name + '</th>';
          cols = getColumnsFromIndexSql(item.tbl_name, item.sql);
          column += '<th>' + cols.join(', ') + '</th>';
          unique = item.sql.indexOf('UNIQUE') > -1 ? 'True' : 'False';
          column += '<th>' + unique + '</th>';
          sqlLink = '<a class="view-sql" ';
          sqlLink += 'data-toggle="modal" data-target="#index_sql_modal" ';
          sqlLink += 'data-name="' + item.name + '" ';
          sqlLink += 'href="#">SQL</a>';
          pre = '<pre style="display: none;">' + item.sql + '</pre>';
          column += '<th>' + sqlLink + pre + '</th>';
          column += '</tr>';
          return $('#table_indexes tbody').append(column);
        });
        return cb();
      });
    });
  });
};

buildTableContent = function(name, cb) {
  return getTableContent(name, function(data) {
    var row;
    resetResultTable();
    addHeadersToResultTable((function() {
      var _i, _len, _ref, _results;
      _ref = data.columns;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _results.push(buildResultHeader(name));
      }
      return _results;
    })());
    addRowsToResultTable((function() {
      var _i, _len, _ref, _results;
      _ref = data.rows;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        _results.push(buildResultRow(row));
      }
      return _results;
    })());
    return cb();
  });
};

buildTableQueryResult = function(query) {
  return getQuery(query, function(data) {
    var name, row;
    resetResultTable();
    addHeadersToResultTable((function() {
      var _i, _len, _ref, _results;
      _ref = data.columns;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _results.push(buildResultHeader(name));
      }
      return _results;
    })());
    return addRowsToResultTable((function() {
      var _i, _len, _ref, _results;
      _ref = data.rows;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        _results.push(buildResultRow(row));
      }
      return _results;
    })());
  });
};

loadTables = function(cb) {
  $('#tables li').remove;
  return getTables(function(data) {
    var table;
    data.tables.forEach(function(item) {
      return $('<li><span>' + item + '</span></li>').appendTo('#tables');
    });
    if (data.tables.length > 0) {
      $('#tables li.selected').removeClass('selected');
      table = $('#tables li:first');
      $(table).addClass('selected');
      showTableInfo();
      showTableStructure();
    }
    return cb();
  });
};

showDatabaseInfo = function() {
  return getInfo(function(data) {
    $('#db_file_name').text(data.filename);
    $('#db_size').text(bytesToSize(data.size));
    $('#db_count_tables').text(data.number_of_tables);
    return $('#db_count_indexes').text(data.number_of_indexes);
  });
};

showTableInfo = function() {
  var name;
  name = $('#tables li.selected').text();
  if (name.length === 0) {
    alert('No table selected. Please, select a table.');
    return;
  }
  return getTableInfo(name, function(data) {
    $('#table_information').show();
    return $('#table_count_rows').text(data.row_count);
  });
};

showTableStructure = function() {
  var name;
  name = $('#tables li.selected').text();
  if (name.length === 0) {
    alert('No table selected. Please, select a table.');
    return;
  }
  return buildTableStructure(name, function() {
    setActiveTab('table_structure');
    $('#structure').show();
    $('#input').hide();
    return $('#output').hide();
  });
};

showTableContent = function() {
  var name;
  name = $('#tables li.selected').text();
  if (name.length === 0) {
    alert('No table selected. Please, select a table.');
    return;
  }
  return buildTableContent(name, function() {
    setActiveTab('table_content');
    $('#structure').hide();
    $('#input').hide();
    $('#output').addClass('full');
    return $('#output').show();
  });
};

showTableQuery = function(query) {
  resetResultTable();
  setActiveTab('table_query');
  $('#structure').hide();
  $('#output').removeClass('full');
  $('#input').show();
  return $('#output').show();
};

runQuery = function(query) {
  $('#run #export_csv #export_json').prop('disabled', true);
  buildTableQueryResult(query);
  return $('#run #export_csv #export_json').prop('disabled', false);
};

exportCSV = function(query) {
  var host, url, win;
  query = window.encodeURI(query.replace(/\n/g, ' '));
  host = window.location.host;
  url = 'http://' + host + '/api/query?format=csv&query=' + query;
  return win = window.open(url, '_blank');
};

exportJSON = function(query) {
  var host, url, win;
  query = window.encodeURI(query.replace(/\n/g, ' '));
  host = window.location.host;
  url = 'http://' + host + '/api/query?format=json&query=' + query;
  return win = window.open(url, '_blank');
};

buildResultHeader = function(name) {
  var result;
  return result = '<th>' + name + '</th>';
};

addHeadersToResultTable = function(headers) {
  var header;
  header = '<thead><tr>';
  headers.forEach(function(h) {
    return header += h;
  });
  header += '</tr></thead>';
  return $('#table_results').append(header);
};

buildResultRow = function(row) {
  var result;
  result = '<tr>';
  row.forEach(function(v) {
    return result += '<th>' + v + '</th>';
  });
  return result += '</tr>';
};

addRowsToResultTable = function(rows) {
  var body;
  body = '<tbody>';
  rows.forEach(function(row) {
    return body += row;
  });
  body += '</tbody>';
  return $('#table_results').append(body);
};

resetResultTable = function() {
  return $('#table_results').empty();
};

setActiveTab = function(name) {
  $('#navbar li.selected').removeClass('selected');
  return $('#' + name).addClass('selected');
};

bytesToSize = function(bytes) {
  var i, sizes;
  sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) {
    return '0 Byte';
  }
  i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

getColumnsFromIndexSql = function(name, sql) {
  if (!sql) return [];
  var i, match, matches, result;
  i = sql.indexOf('"' + name + '"');
  sql = sql.slice(i + 1, sql.length - 1);
  matches = sql.match(/(\"[\w\s]+\")/g);
  if (!matches) return [];
  result = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = matches.length; _i < _len; _i++) {
      match = matches[_i];
      _results.push(match.replace(/"/g, ''));
    }
    return _results;
  })();
  return result;
};

$(function() {
  var editor;
  editor = ace.edit('editor');
  editor.setTheme('ace/theme/textmate');
  editor.getSession().setMode('ace/mode/sql');
  $('#tables').on('click', 'li', function() {
    $('#tables li.selected').removeClass('selected');
    $(this).addClass('selected');
    showTableInfo();
    return showTableStructure();
  });
  $('#table_structure').on('click', function() {
    return showTableStructure();
  });
  $('#table_content').on('click', function() {
    return showTableContent();
  });
  $('#table_query').on('click', function() {
    return showTableQuery();
  });
  $('#index_sql_modal').on('show.bs.modal', function(event) {
    var button, modal, sql, title;
    button = $(event.relatedTarget);
    title = button.data('name');
    sql = button.next('pre').text();
    modal = $(this);
    modal.find('.modal-title').text(title);
    return modal.find('.modal-body pre').text(sql);
  });
  $('#run').on('click', function() {
    var query;
    query = $.trim(editor.getValue());
    if (query.length === 0) {
      return;
    }
    return runQuery(query);
  });
  $('#export_csv').on('click', function() {
    var query;
    query = $.trim(editor.getValue());
    if (query.length === 0) {
      return;
    }
    return exportCSV(query);
  });
  $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
    return console.log(label);
  });
  return loadTables(function() {
    showDatabaseInfo();
    return $('#main').show();
  });
});
