/* ------------------------------------------------
gets list of meeting feeds based on [id] or [list]:
?list=1,3 | multiple groups of feeds
?id=sep,rgb | multiple feeds
 ------------------------------------------------ */
function doGet(e) {
  const id = !e.parameter.id ? [] : e.parameter.id.split(','); 
  const list = !e.parameter.list ? [] : e.parameter.list.split(',');
  if (id.length == 0 && list.length == 0) return jsonOutput('{"Error": "No value provided for [id] or [list]."}');
  
  // filter feeds
  const feeds = [
    {list: '1', id: 'sep', suffix: '-sep', name: 'SEPIA', url: 'https://www.aasepia.org/meeting-guide/api/'}, 
    {list: '3', id: 'rgb', suffix: '-rgb', name: 'Reading-Berks', url: 'https://readingberksintergroup.org/wp-admin/admin-ajax.php?action=meetings'}, 
  ].filter(f => list.includes(f.list) || id.includes(f.id))
  if (feeds.length == 0) return jsonOutput(`{"Error": "Feed [id] or [list] not found. | ${qsDecode(e.queryString)}"}`);
  
  // get data for all feeds using fetchAll:
  // 1. map() feeds into request list
  // 2. use fetchAll to get list of responses
  // 3. use flatMap() on the results, parsing each and formatting the slugs
  let meetings = UrlFetchApp.fetchAll(
    feeds.map(f => ({
      url: f.url, 
      muteHttpExceptions: true, 
      validateHttpsCertificates: false
      }))
    ).flatMap((resp, i) => getMeetingsResp(resp, feeds[i]));
  if (meetings.length == 0) return jsonOutput(`{"Error": "Error retrieving data. | ${qsDecode(e.queryString)}"}`);

  // return final results as JSON
  return jsonOutput(JSON.stringify(meetings)); 
} 


// get meetings for a single feed response
const getMeetingsResp = (resp, f) => {
  let m = []
  try { 
    const rc = resp.getResponseCode();
    console.log(`${f.name}: ${rc}\n${f.url}`);
    m = rc != 200 ? [] : JSON.parse(resp.getContentText(), (k,v) => k == 'slug' ? v + f.suffix : v);
  }
  catch {}
  return m;
}

// send string to browser as JSON
const jsonOutput = (s) => ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);

// decode query string 
const qsDecode = (qs) => decodeURIComponent(qs.replace(/\+/g, ' '));
