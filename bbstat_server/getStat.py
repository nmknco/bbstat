#!/usr/bin/env python3

from bs4 import BeautifulSoup
import sys
from urllib.request import *
import json
from pymongo import MongoClient

def getPage(key_bbref):
    # print("Getting Page For: %s" % key_bbref)
    url = "https://www.baseball-reference.com/players/"
    url += key_bbref[0] + "/" + key_bbref + ".shtml"
    res = urlopen(url)

    if res.status == 200:
        # print("Success!")
        return res.read().decode('utf8') 
    else:
        # print("Failure: " + res.msg)
        return 1

def getData(page):
    soup = BeautifulSoup(page, 'lxml')

    tables = soup.select('#content > div')
    table_standard = tables[0]
    table_value = tables[1]

    keys1 = []
    keys2 = []
    keys3 = [] # keys for retrieving data form bbref
    keys1_name = []
    keys2_name = []
    keys3_name = [] # column names as shown to user

    position_kw = ""

    if table_standard['id'] == 'all_batting_standard':

        position_kw = "batting"
        # print("Position player")
        keys1 = ["age", "team_ID"]      
        keys2 = ["batting_avg", "onbase_perc", "slugging_perc",
                    "G", "PA", "HR", "RBI", "SB", "BB", "SO", 
                    "onbase_plus_slugging_plus"
                ]
        keys3 = ["WAR", "Salary"] 
        keys1_name = ["Age", "Team"]
        keys2_name = ["AVG", "OBP", "SLG",
                        "G", "PA", "HR", "RBI", "SB", "BB", "SO",
                        "OPS+"]
        keys3_name = ["WAR", "Salary"]

    else:

        position_kw = "pitching"
        # print("Pitcher")
        keys1 = ["age", "team_ID"]      
        keys2 = ["earned_run_avg", "fip", "whip",
                    "G", "GS", "IP", "earned_run_avg_plus", "hits_per_nine", 
                    "home_runs_per_nine", "bases_on_balls_per_nine", "strikeouts_per_nine"
                ]
        keys3 = ["WAR_pitch", "Salary"] 
        keys1_name = ["Age", "Team"]
        keys2_name = ["ERA", "FIP", "WHIP",
                        "G", "GS", "IP", "ERA+", "H9",
                        "HR9", "BB9", "SO9"]
        keys3_name = ["WAR", "Salary"]

    # rows_clone = table_standard.select('#batting_standard_clone ')
    ## So it turns out that the batting_standard_alone table are somehow dynamically
    ## generated, and in the scraped page the year, age and team are in 
    ## the standard table...
    rows_standard = table_standard.select('#%s_standard > tbody > tr' % position_kw)
    rows_value_str = table_value.contents[-2]
    rows_value = BeautifulSoup(rows_value_str, 'lxml'
                    ).select('#%s_value > tbody > tr' % position_kw)
    # value table only contains MLB-active years

    i = 0  # there may be minor league rows in between MLB rows
    j = 0     # in standard table but not in value table
    data = []
    while j < len(rows_value):
        datarow = {}
        rs = rows_standard[i]
        i += 1
        if 'minors_table' in rs['class']: 
            continue
        rv = rows_value[j]
        j += 1
        # dealing with year column separately as it's a <th>
        datarow["Year"] = getText(rs.select('th[data-stat="year_ID"]')[0])

        for k, kn in zip(keys1+keys2, keys1_name+keys2_name):
            datarow[kn] = getTextByStat(rs, k)
            # print(kn)
            # print(data[kn])
        for k, kn in zip(keys3, keys3_name):
            datarow[kn] = getTextByStat(rv, k)
            # print(kn)
            # print(data[kn])
        data.append(datarow)

    print(data)
    return data

def getText(tdnode):
    while tdnode != "" and tdnode.name != None:
        if len(tdnode.contents) > 0:
            tdnode = tdnode.contents[0]
        else:
            tdnode = ""
    return tdnode

def getTextByStat(trnode, stat_name):
    # trnode is usually a row for a year
    return getText(trnode.select('td[data-stat="%s"]'%stat_name)[0])

def writeToDb(key_bbref, ls):
    client = MongoClient()
    db = client.database_1
    collection = db.player_collection
    p = collection.update_one(
            {'_id' : key_bbref}, 
            {'$set': { 'data' : ls }},
            upsert = True
        )


if __name__ == "__main__":
    key_bbref = sys.argv[1]
    page = getPage(key_bbref)
    if page != 1:
        # print("getPage successful!")
        writeToDb(key_bbref, getData(page))
