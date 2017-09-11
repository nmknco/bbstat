#!/usr/bin/env python3

# This script compiles a json file from
# people.csv (DATA SOURCE:
# https://github.com/chadwickbureau/register)

import json
import csv

EARLIEST_YEAR = 1900

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
        first_name = row[col_nums[4]]
        suffix = row[col_nums[6]]
        # if suffix != "": print(suffix)

        # There's a complication where names like "de la Rosa" are also
        #   written as "De La Rosa". To handle these cases more easily
        #   we use ALL-UPPERCASE last name as keys
        last_name = last_name.upper()
        # include suffix as part of the last name
        # we still keep copy of original last name and suffix in dict items
        if suffix != "":
            if suffix[-1] == '.':
                suffix = suffix[:-1] # remove '.' at the end
            last_name += " " + suffix.upper()

        # first name is kept in the data in original form
        #  only converted to uppercase when doing matching

        dp = {} # player record
        for col_num, col_name in cols:
            dp[col_name] = row[col_num]

        if last_name not in d:
            d[last_name] = [dp]
        else:
            d[last_name].append(dp)

        # cnt_ctrl += 1
        # if cnt_ctrl >= 10: break

    print(len(d))
    # print([(k, d[k]) for k in list(d.keys())[:10]])

    # print(d["DE LA ROSA"]) 
    # print(d["O'DAY"])
    print(d["GRIFFEY JR"])
    print([dp["name_first"] for dp in d["LOPEZ"]])

    # # print all last name without a cap at the beginning
    # # not working when using all capitalized keys
    # for k in d.keys():
    #     if k[0] < "A" or k[0] > "Z":
    #         print(k)

with open('people.json', 'w') as f:
    f.write(json.dumps(d))