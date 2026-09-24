<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/index.php';

class Unit extends TestCase
{
    /**
     * Whether the keyword is empty
     */
    public function testKeywordEmpty()
    {
        $result = fetch(keyword: '', api_key: '');

        $this->assertArrayHasKey('error', $result);
        $this->assertEquals('Keyword cannot be empty.', $result['error']);
    }

    /**
     * Whether the request failed
     */
    public function testFailedRequest()
    {
        $result = fetch(keyword: 'error', api_key: '');

        $this->assertArrayHasKey('error', $result);
        $this->assertEquals('Failed to retrieve results from API.', $result['error']);
    }

    /**
     * Test successful output structure
     */
    public function testSuccessfulOutput()
    {
        $api_key = getenv('SERP_API_KEY');

        $result = fetch(keyword: 'success', api_key: $api_key);

        // Validate JSON
        $json = json_encode($result);
        $this->assertNotFalse($json, 'Failed to JSON encode results array!');
        $this->assertTrue(json_validate($json), 'Results output is not valid JSON!');

        // Decode back to verify JSON content integrity
        $decoded = json_decode($json, true);
        $this->assertIsArray($decoded);

        // Verify status and metadata
        $this->assertIsArray($result);
        $this->assertArrayHasKey('status', $result);
        $this->assertEquals('succeeded', $result['status']);
        $this->assertEquals(200, $result['code']);
        $this->assertEquals('success', $result['keyword']);

        // Verify structure
        $this->assertArrayHasKey('results', $result);
        $this->assertIsArray($result['results']);
        $this->assertNotEmpty($result['results'], 'Expected results shall not be empty.');

        // Verify fields
        $item = $result['results'][0];
        $this->assertArrayHasKey('title', $item);
        $this->assertArrayHasKey('link', $item);
        $this->assertArrayHasKey('snippet', $item);

        $this->assertIsString($item['title']);
        $this->assertIsString($item['link']);
        $this->assertIsString($item['snippet']);
    }
}