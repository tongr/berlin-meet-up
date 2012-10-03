describe("time util", function() {
  it("should be able to parse time strings", function() {
    expect(Time.parse("13:30") instanceof Date).toBe(true);

    // test time parser
    expect(Time.toString(Time.parse("13:30"))).toBe("13:30");
    expect(Time.toString(Time.parse("13:31:00"))).toBe("13:31");
    expect(Time.toString(Time.parse("13:32:12"))).toBe("13:32:12");
  });

  it("should be able to detect date switches", function() {
    var now = new Date();
    //var tomorrowSameTime = new Date(now.getTime() + 86400000);
    var sameTimeTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDay()+1, now.getHours(), now.getMinutes(), now.getSeconds());
    // create a date one second in the future
    var future = new Date(now.getTime() + 1000);
    // parse the time and ensure that it is later than the *future* variable
    expect(Time.parse(Time.toString(now), future).getTime()).toBe(sameTimeTomorrow.getTime());
  });

  it("should know what *now* means", function() {
    var actual = Time.now();
    var expected = new Date();
    expected = new Date(expected.getFullYear(), expected.getMonth(), expected.getDay(), expected.getHours(), expected.getMinutes(), expected.getSeconds());
    
    // parse the time and ensure that it is later than the *future* variable
    expect(actual).toEqual(expected);
  });
});

describe("time span instances", function() {
  it("should be able to calculate time spans correct", function() {
    var now = past = new Date();

    // create a new Date 1 second later
    now = new Date(now.getTime() + 1000);
    expect(TimeSpan.between(past, now).toString()).toBe("1s");
    expect(TimeSpan.between(past, now)).toEqual(new TimeSpan(1));

    // create a new Date even 2 minutes later
    now = new Date(now.getTime() + 120000);
    expect(TimeSpan.between(past, now).toString()).toBe("2min 1s");
    expect(TimeSpan.between(past, now)).toEqual(new TimeSpan(121));

    // create a new Date even 3 hours later
    now = new Date(now.getTime() + 10800000);
    expect(TimeSpan.between(past, now).toString()).toBe("3h 2min 1s");
    expect(TimeSpan.between(past, now)).toEqual(new TimeSpan(10921));
  });
});

describe("waypoint instances", function() {
  it("should be able to instantiate correctly", function() {
    var wp1 = new Waypoint(new Coordinates(0, 1), Time.parse("11:30"));
    expect(wp1.coords.latitude).toBe(0);
    expect(wp1.coords.longitude).toBe(1);
    expect(wp1.coords).toEqual(new Coordinates(0, 1));
    expect(Time.toString(wp1.time)).toBe("11:30");
    expect(wp1.toString()).toBe("Waypoint: 11:30 @ (0, 1)");

    var wp2 = new Waypoint(new Coordinates(2, 3), Time.parse("12:30:10"));
    expect(wp2.coords.latitude).toBe(2);
    expect(wp2.coords.longitude).toBe(3);
    expect(wp2.coords).toEqual(new Coordinates(2, 3));
    expect(Time.toString(wp2.time)).toBe("12:30:10");
    expect(wp2.toString()).toBe("Waypoint: 12:30:10 @ (2, 3)");
  });
});

describe("meeting point finder", function() {
  var waypoints1 = [
  // wp_a
  new Waypoint(new Coordinates(0, 1), Time.parse("11:29")),
  // wp_b
  new Waypoint(new Coordinates(0, 2), Time.parse("11:31")),
  // wp_x(1) - this is where the routes differ
  new Waypoint(new Coordinates(0, 3), Time.parse("11:32")),
  // wp_d
  new Waypoint(new Coordinates(2, 3), Time.parse("11:34"))];
  
  var waypoints2 = [
  // wp_d
  new Waypoint(new Coordinates(2, 3), Time.parse("11:30")),
  // wp_x(2) - this is where the routes differ
  new Waypoint(new Coordinates(2, 2), Time.parse("11:32")),
  // wp_b
  new Waypoint(new Coordinates(0, 2), Time.parse("11:33")),
  // wp_y - the route differs again
  new Waypoint(new Coordinates(0, 1.5), Time.parse("11:34")),
  // wp_a
  new Waypoint(new Coordinates(0, 1), Time.parse("11:35"))];
  
  
  it("should match two waypoint sets correctly", function() {
    var mappings = getMapping(waypoints1, waypoints2);
    expect(mappings.length).toBe(4);
    // wp_a
    expect(mappings[0]).toBe(4);
    // wp_b
    expect(mappings[1]).toBe(2);
    // wp_x(1/2) - this is where the routes differ
    expect(mappings[2]).toBe(-1);
    // wp_d
    expect(mappings[3]).toBe(0);
    // wp_y has no match
  });

  it("should be able to score waypoints correctly", function() {
    // TODO findMeetingPoints
    var matchings = findMeetingPoints(waypoints1, waypoints2);
    
    expect(matchings.length).toBe(3);
    
    console.log(matchings);

    // wp_b
    expect(matchings[0]).toEqual({diff : new TimeSpan(2 * 60), wp1 : waypoints1[1], wp2 : waypoints2[2]});
    // wp_d
    expect(matchings[1]).toEqual({diff : new TimeSpan(4 * 60), wp1 : waypoints1[3], wp2 : waypoints2[0]});
    // wp_a
    expect(matchings[2]).toEqual({diff : new TimeSpan(6 * 60), wp1 : waypoints1[0], wp2 : waypoints2[4]});
    // wp_x & wp_y do not match

  });
});
