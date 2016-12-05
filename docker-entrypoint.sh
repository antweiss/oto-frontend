#!/bin/bash
set -e

set -- tini -- "$@"

exec "$@"
