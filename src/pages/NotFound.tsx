import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { EmptyStateBack } from "@/components/common/EmptyStateBack";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return <EmptyStateBack title="404" message="Esta página não existe ou foi removida." fallbackRoute="/" />;
};

export default NotFound;
