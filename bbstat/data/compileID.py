#!/usr/bin/env python3

# This script compiles a json file from
# people.csv (DATA SOURCE:
# https://github.com/chadwickbureau/register)

import json
import csv

EARLIEST_YEAR = 1990

with open('people.csv', 'r') as f:
    data = csv.reader(f)

    fields = data.next()
    # print(fields)

    col_names = ['key_mlbam', 'key_bbref', 'key_bbref_minors',
            'name_last', 'name_first', 'name_given', 
            'name_suffix', 'pro_played_last', 'mlb_played_last'
            ]
    col_nums = [fields.index(cn) for cn in col_names]
    cols = zip(col_nums, col_names)
    # print(cols)

    d = {}
    # cnt_ctrl = 0;
    for row in data: # will start from the second row
        mlbam = row[col_nums[0]]
        bbref = row[col_nums[1]]
        bbref_minors = row[col_nums[2]]
        if mlbam == '' or bbref == '' or bbref_minors == '':
            continue

        mlb_last = row[col_nums[-1]]
        if mlb_last == '' or int(mlb_last) < EARLIEST_YEAR:
            continue

        last_name = row[col_nums[3]]

        dp = {} # player record
        for col_num, col_name in cols:
            dp[col_name] = row[col_num]
        if last_name not in d:
            d[last_name] = [dp]
        else:
            d[last_name].append(dp)

        # cnt_ctrl += 1
        # if cnt_ctrl >= 10: break

    # print len(d)
    # print d['Jeter']

with open('people.json', 'w') as f:
    f.write(json.dumps(d))